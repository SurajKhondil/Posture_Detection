# Recommendation Engine - Groq AI Integration (Procedural)
import json
from typing import Dict, List, Optional
from groq import Groq
from sqlalchemy import select, insert, delete
from ..database import recommendations_table, posture_results_table, users_table, get_connection, sessions_table
from . import config
from . import logger

def build_groq_prompt(user_profile: Dict, results: Dict, angle_maps: Optional[Dict] = None, trends: Optional[Dict] = None) -> str:
    """Build prompt for Groq AI with angle-time map data"""
    metric_scores = {k: v["risk_percent"] for k, v in results.items() if k != "__OVERALL__"}
    if not metric_scores:
        dom_metric, dom_score = "general posture", 0
    else:
        dom_metric = max(metric_scores, key=metric_scores.get)
        dom_score = metric_scores[dom_metric]
    
    prompt = f"""You are a posture health expert. Generate a personalized posture improvement recommendation.

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')}
- Height: {user_profile.get('height_cm', 'Unknown')} cm
- Weight: {user_profile.get('weight_kg', 'Unknown')} kg

POSTURE ANALYSIS RESULTS:
- Dominant Issue: {dom_metric} ({dom_score}% risk)
- Overall Risk: {results.get('__OVERALL__', {}).get('average_risk_percent', 0)}%

DETAILED METRICS:
"""
    for k, v in results.items():
        if k == "__OVERALL__": continue
        prompt += f"- {v['metric']}: {v['risk_percent']}% risk ({v['status']})\n"
        if 'angle_range' in v:
            prompt += f"  Range: {v['angle_range'][0]}° to {v['angle_range'][1]}° ({v.get('unique_angles', 0)} unique values)\n"
    
    if angle_maps:
        prompt += "\nANGLE DISTRIBUTION DETAILS:\n"
        for cam, metrics in angle_maps.items():
            for m_name, a_time in metrics.items():
                sorted_a = sorted(a_time.items(), key=lambda x: x[1], reverse=True)[:3]
                if sorted_a:
                    prompt += f"- {cam} {m_name}: Most common angles are "
                    prompt += ", ".join([f"{a}° ({t:.1f}s)" for a, t in sorted_a])
                    prompt += "\n"
    
    if trends:
        prompt += "\nTRENDS:\n"
        for m, t in trends.items():
            prompt += f"- {m}: {t['direction']} (change: {t['change']:+.1f}%)\n"
    
    prompt += """
Generate a response in the following JSON format:
{
    "priority": "HIGH" or "MEDIUM" or "LOW",
    "message": "Brief explanation of main issue with specific angle insights",
    "actions": ["action 1", "action 2", "action 3"]
}
Be specific, actionable, and personalized.
"""
    return prompt

def call_groq_api(prompt: str) -> Optional[Dict]:
    """Call Groq API for recommendation generation"""
    if not getattr(config, 'ENABLE_AI', False): return None
    try:
        client = Groq(api_key=config.GROQ_API_KEY)
        logger.log_ai("Calling Groq API", {"model": config.GROQ_MODEL})
        response = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a posture health expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        content = response.choices[0].message.content
        start = content.find('{')
        end = content.rfind('}') + 1
        return json.loads(content[start:end]) if start != -1 and end > start else None
    except Exception as e:
        logger.log_error("Groq API Failed", e)
        return None

def get_fallback_recommendation(results: Dict, dom_metric: str) -> Dict:
    """Generate rule-based fallback recommendation"""
    score = results.get(dom_metric, {}).get("risk_percent", 0)
    priority = "HIGH" if score >= config.RISK_THRESHOLDS["HIGH"] else ("MEDIUM" if score >= config.RISK_THRESHOLDS["MODERATE"] else "LOW")
    rule = config.METRIC_RULES.get(dom_metric, {})
    return {
        "priority": priority,
        "message": f"Posture issue: {rule.get('label', dom_metric)}. Risk level: {score}%",
        "actions": rule.get("base_actions", ["Maintain neutral posture", "Take regular breaks"]).copy()
    }

def compute_trends(session_id: int) -> Dict:
    """Compute trends from historical data"""
    try:
        conn = get_connection()
        user_id = conn.execute(select(sessions_table.c.user_id).where(sessions_table.c.id == session_id)).scalar()
        if not user_id: return {}
        s_ids = [r[0] for r in conn.execute(select(sessions_table.c.id).where((sessions_table.c.user_id == user_id) & (sessions_table.c.status == "completed")).order_by(sessions_table.c.start_time.desc()).limit(5)).fetchall()]
        if len(s_ids) < 2: return {}
        
        trends_raw = defaultdict(list)
        for sid in s_ids:
            # Table indices: 0:id, 1:session_id, 2:user_id, 3:metric_name, 4:risk_percent
            for row in conn.execute(select(posture_results_table).where(posture_results_table.c.session_id == sid)).fetchall():
                trends_raw[row[3]].append(row[4])
        conn.close()
        
        res = {}
        for m, v in trends_raw.items():
            if len(v) < 2: continue
            d = v[0] - v[-1]
            dir = "WORSENING" if d > config.TREND_THRESHOLD else ("IMPROVING" if d < -config.TREND_THRESHOLD else "STABLE")
            res[m] = {"direction": dir, "change": d, "latest": v[0]}
        return res
    except: return {}

def generate_recommendation(session_id: int, user_id: int, scoring_results: Dict, angle_maps: Optional[Dict] = None) -> Dict:
    """Main recommendation generation function"""
    try:
        logger.log_ai("Recommendation Started", {"session_id": session_id})
        conn = get_connection()
        conn.execute(delete(recommendations_table).where(recommendations_table.c.session_id == session_id))
        conn.commit()
        
        u_p = conn.execute(select(users_table).where(users_table.c.id == user_id)).fetchone()
        user_profile = dict(u_p._mapping) if u_p else {"age": 28, "height_cm": 170, "weight_kg": 65}
        conn.close()
        
        trends = compute_trends(session_id)
        m_scores = {k: v["risk_percent"] for k, v in scoring_results.items() if k != "__OVERALL__"}
        dom_m = max(m_scores, key=m_scores.get) if m_scores else "general"
        dom_s = m_scores.get(dom_m, 0)
        risk_l = "HIGH" if dom_s >= config.RISK_THRESHOLDS["HIGH"] else ("MODERATE" if dom_s >= config.RISK_THRESHOLDS["MODERATE"] else "LOW")
        
        rec_data = call_groq_api(build_groq_prompt(user_profile, scoring_results, angle_maps, trends)) if getattr(config, 'ENABLE_AI', False) else None
        if not rec_data: rec_data = get_fallback_recommendation(scoring_results, dom_m)
        
        conn = get_connection()
        conn.execute(insert(recommendations_table).values(
            session_id=session_id, user_id=user_id,
            recommendation_text=rec_data.get("message", ""),
            priority=rec_data.get("priority", "MEDIUM"),
            dominant_issue=dom_m, risk_level=risk_l,
            actions_json=json.dumps(rec_data.get("actions", []))
        ))
        conn.commit()
        conn.close()
        logger.log_success("Recommendation Saved", {"session_id": session_id})
        return {"session_id": session_id, "user_id": user_id, "risk_level": risk_l, "dominant_issue": dom_m, "recommendation": rec_data}
    except Exception as e:
        logger.log_error("Recommendation Failed", e, {"session_id": session_id})
        return {}


def get_session_recommendation(session_id: int) -> Optional[Dict]:
    """Fetch the saved recommendation for a session from the DB"""
    try:
        conn = get_connection()
        row = conn.execute(
            select(recommendations_table).where(
                recommendations_table.c.session_id == session_id
            ).order_by(recommendations_table.c.created_at.desc()).limit(1)
        ).fetchone()
        conn.close()

        if not row:
            return None

        r = dict(row._mapping)
        # actions_json may be a JSON string or already a list
        actions = r.get("actions_json")
        if isinstance(actions, str):
            try:
                import json as _json
                actions = _json.loads(actions)
            except Exception:
                actions = [{"action": actions}]

        return {
            "recommendation_text": r.get("recommendation_text", ""),
            "priority": r.get("priority", "LOW"),
            "dominant_issue": r.get("dominant_issue", "None"),
            "risk_level": r.get("risk_level", "UNKNOWN"),
            "actions_json": actions or [],
        }
    except Exception as e:
        logger.log_error("Recommendation Fetch Failed", e, {"session_id": session_id})
        return None
