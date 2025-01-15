// Extension version
export const VERSION = 'v1.2.1';

/**
 * Settings keys for chrome.storage.local
 * All settings default to true if not set
 */
export const SETTINGS = {
    /** Shows warning if answer format doesn't match expected pattern */
    VALIDATION_ENABLED: 'validationEnabled',
    /** Shows machine info at the bottom of room pages */
    MACHINE_INFO_ENABLED: 'machineInfoEnabled',
    /** Adds copy buttons to command blocks */
    COPY_COMMAND_ENABLED: 'copyCommandEnabled'
};

/**
 * TryHackMe API endpoints and documentation
 */
export const API = {
    /**
     * GET /api/v2/vms/running
     * Fetches list of running machines for current user
     * 
     * Response schema:
     * {
     *   success: boolean,
     *   data: Array<{
     *     id: string,          // Machine ID
     *     name: string,        // Machine name
     *     roomCode: string,    // Room code (e.g., "basicpentesting")
     *     title: string,       // Display title
     *     internalIP: string,  // IP address when running
     *     expires: string,     // ISO date string
     *     status: string       // Machine status
     *   }>
     * }
     * 
     * Required headers:
     * - Accept: application/json
     * - Cache-Control: no-cache
     * - Credentials: include
     */
    RUNNING_MACHINES: 'https://tryhackme.com/api/v2/vms/running',

    /**
     * POST /api/v2/vms/terminate
     * Terminates a specific machine
     * 
     * Request body:
     * {
     *   machineId: string  // ID of machine to terminate
     * }
     * 
     * Response schema:
     * {
     *   success: boolean,
     *   message: string
     * }
     * 
     * Required headers:
     * - Content-Type: application/json
     */
    TERMINATE_MACHINE: 'https://tryhackme.com/api/v2/vms/terminate'
}; 