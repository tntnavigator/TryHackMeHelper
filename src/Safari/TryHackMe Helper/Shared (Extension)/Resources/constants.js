/**
 * Constants Module
 * Central location for all configuration and constants
 * Safari-compatible implementation
 */

// Extension version - keep in sync with Info.plist
export const VERSION = 'v1.2.1';

/**
 * Settings keys for browser.storage.local
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
     */
    RUNNING_MACHINES: 'https://tryhackme.com/api/v2/vms/running',

    /**
     * POST /api/v2/vms/terminate
     * Terminates a specific machine
     * 
     * Request body:
     * {
     *   id: string  // ID of machine to terminate
     * }
     * 
     * Response schema:
     * {
     *   success: boolean,
     *   message: string
     * }
     */
    TERMINATE_MACHINE: 'https://tryhackme.com/api/v2/vms/terminate'
}; 