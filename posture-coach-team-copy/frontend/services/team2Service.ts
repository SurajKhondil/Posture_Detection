/**
 * Team 2 API Service - Pain Risk Analysis
 * 
 * This service handles communication with Team 2's pain risk analysis API.
 * It sends user profile data and receives pain risk assessments.
 */


// Team 2 API Configuration
const TEAM2_API_BASE_URL = 'YOUR_TEAM2_API_URL_HERE'; // Replace with Team 2's actual API URL

/**
 * User Profile Data Format for Team 2
 * This is the structure Team 2 expects to receive
 */
export interface Team2UserProfile {
    userId: string;
    name: string;
    age_group: string;
    sitting_hours_per_day: string;
    height_cm?: number;
    weight_kg?: number;
    work_duration?: string;
    timestamp: string;
}

/**
 * Pain Risk Response from Team 2
 */
export interface PainRiskResponse {
    userId: string;
    timestamp: string;
    riskAreas: {
        neck: 'low' | 'medium' | 'high';
        shoulder: 'low' | 'medium' | 'high';
        head: 'low' | 'medium' | 'high';
        torso: 'low' | 'medium' | 'high';
        lowerBack?: 'low' | 'medium' | 'high';
    };
    recommendations?: string[];
    overallRiskScore?: number;
}

class Team2Service {
    private apiBaseUrl: string;

    constructor() {
        this.apiBaseUrl = TEAM2_API_BASE_URL;
    }

    /**
     * Format user profile data for Team 2 API
     * Converts our app's user profile format to Team 2's expected format
     */
    formatUserProfileForTeam2(userProfile: any, userId: string): Team2UserProfile {
        return {
            userId: userId,
            name: userProfile.name || 'Unknown',
            age_group: userProfile.ageGroup || '18-25',
            sitting_hours_per_day: userProfile.sittingHours || '5-6',
            height_cm: userProfile.height ? parseInt(userProfile.height) : undefined,
            weight_kg: userProfile.weight ? parseInt(userProfile.weight) : undefined,
            work_duration: userProfile.workDuration,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Send user profile to Team 2 API
     * @param userProfile - User profile from our app store
     * @param userId - Unique user identifier
     * @returns Promise with pain risk response
     */
    async sendUserProfile(userProfile: any, userId: string): Promise<PainRiskResponse> {
        try {
            const formattedProfile = this.formatUserProfileForTeam2(userProfile, userId);

            const response = await fetch(`${this.apiBaseUrl}/api/user-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formattedProfile),
            });

            if (!response.ok) {
                throw new Error(`Team 2 API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending user profile to Team 2:', error);
            throw error;
        }
    }

    /**
     * Get pain risk analysis from Team 2
     * @param userId - User identifier
     * @param postureData - Optional posture data from Team 1
     * @returns Promise with pain risk assessment
     */
    async getPainRiskAnalysis(
        userId: string,
        postureData?: any
    ): Promise<PainRiskResponse> {
        try {
            const requestBody = {
                userId,
                postureData,
                timestamp: new Date().toISOString(),
            };

            const response = await fetch(`${this.apiBaseUrl}/api/pain-risk-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Team 2 API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting pain risk analysis from Team 2:', error);
            // Return mock data for development
            return this.getMockPainRiskData(userId);
        }
    }

    /**
     * Mock pain risk data for development/testing
     * Remove this when Team 2 API is ready
     */
    private getMockPainRiskData(userId: string): PainRiskResponse {
        return {
            userId,
            timestamp: new Date().toISOString(),
            riskAreas: {
                neck: 'low',
                shoulder: 'medium',
                head: 'low',
                torso: 'low',
            },
            recommendations: [
                'Take regular breaks every 30 minutes',
                'Adjust monitor height to eye level',
                'Practice shoulder stretches',
            ],
            overallRiskScore: 35,
        };
    }

    /**
     * Update user profile on Team 2's system
     * Call this whenever user updates their profile
     */
    async updateUserProfile(userProfile: any, userId: string): Promise<boolean> {
        try {
            const formattedProfile = this.formatUserProfileForTeam2(userProfile, userId);

            const response = await fetch(`${this.apiBaseUrl}/api/user-profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formattedProfile),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating user profile on Team 2:', error);
            return false;
        }
    }
}

// Export singleton instance
export const team2Service = new Team2Service();
