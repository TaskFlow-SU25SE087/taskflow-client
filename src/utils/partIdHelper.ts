/**
 * Utility functions to handle project part ID extraction from backend responses
 */

export interface ProjectPart {
  id: string;
  name: string;
  programmingLanguage: string;
  framework: string;
  repoUrl?: string;
  ownerId?: string;
  ownerName?: string;
  avatrarUrl?: string;
}

/**
 * Extract the correct part ID from backend response
 * Backend might return different structures, so we need to handle various cases
 */
export function extractPartId(response: any): string {
  console.log('Extracting part ID from response:', response);
  
  // Case 1: response is a string (direct ID)
  if (typeof response === 'string') {
    // Validate that it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(response)) {
      return response;
    } else {
      // If it's a success message, return empty string (will be handled by caller)
      console.warn('Response is a success message, not a UUID:', response);
      return '';
    }
  }
  
  // Case 2: response is an object with id property
  if (response && typeof response === 'object') {
    if (response.id) {
      // Validate that the ID is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(response.id)) {
        return response.id;
      } else {
        console.error('Response has id property but it\'s not a valid UUID:', response.id);
        return '';
      }
    }
    
    // Case 3: response.data is the actual data
    if (response.data) {
      // Check if data is a string (might be success message or ID)
      if (typeof response.data === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(response.data)) {
          return response.data;
        } else {
          console.error('Response.data is a string but not a valid UUID (likely a success message):', response.data);
          return '';
        }
      }
      // If data is an object, try to extract ID from it
      return extractPartId(response.data);
    }
    
    // Case 4: Check for other possible ID fields
    if (response.partId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(response.partId)) {
        return response.partId;
      } else {
        console.error('Response has partId property but it\'s not a valid UUID:', response.partId);
        return '';
      }
    }
  }
  
  // Case 5: response is an array (shouldn't happen for single part creation)
  if (Array.isArray(response)) {
    console.warn('Response is an array, taking first item');
    return extractPartId(response[0]);
  }
  
  console.error('Could not extract valid UUID part ID from response:', response);
  return '';
}

/**
 * Generate a temporary UUID-like string for parts without valid IDs
 */
// function generateTempId(): string {
//   return 'temp-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
// }

/**
 * Process parts data from backend to ensure each part has a valid ID
 * Accept both valid UUIDs and temporary IDs from the backend
 */
export function processPartsData(partsData: any[]): ProjectPart[] {
  if (!Array.isArray(partsData)) {
    console.warn('Parts data is not an array:', partsData);
    return [];
  }
  
  return partsData
    .map((part: any, index: number) => {
      // Only process parts that have a valid ID (UUID or temporary)
      if (!part.id || part.id === '' || typeof part.id !== 'string') {
        console.warn(`Part at index ${index} has no valid id:`, part);
        return null; // Skip this part
      }
      
      // Check if the ID is a temporary ID (allow these)
      if (part.id.startsWith('temp-')) {
        console.log(`Part at index ${index} has temporary ID:`, part.id);
        return part;
      }
      
      // Check if the ID looks like a UUID (basic validation)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(part.id)) {
        console.warn(`Part at index ${index} has invalid ID format (not UUID):`, part.id);
        return null; // Skip this part
      }
      
      return part;
    })
    .filter((part): part is ProjectPart => part !== null); // Remove null values
}

/**
 * Validate if a part ID is valid (not empty, exists in parts list, and is either a valid UUID or temporary ID)
 */
export function validatePartId(partId: string, parts: ProjectPart[]): boolean {
  if (!partId || partId.trim() === '') {
    return false;
  }
  
  // Check if it's a temporary ID (allow these)
  if (partId.startsWith('temp-')) {
    const partExists = parts.find(part => part.id === partId);
    return !!partExists;
  }
  
  // Check if the ID looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(partId)) {
    console.warn('Invalid part ID format (not UUID):', partId);
    return false;
  }
  
  const partExists = parts.find(part => part.id === partId);
  return !!partExists;
} 