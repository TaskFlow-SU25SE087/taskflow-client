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
    return response;
  }
  
  // Case 2: response is an object with id property
  if (response && typeof response === 'object') {
    if (response.id) {
      return response.id;
    }
    
    // Case 3: response.data is the actual data
    if (response.data) {
      return extractPartId(response.data);
    }
  }
  
  // Case 4: response is an array (shouldn't happen for single part creation)
  if (Array.isArray(response)) {
    console.warn('Response is an array, taking first item');
    return extractPartId(response[0]);
  }
  
  console.warn('Could not extract part ID from response:', response);
  return '';
}

/**
 * Process parts data from backend to ensure each part has a valid ID
 */
export function processPartsData(partsData: any[]): ProjectPart[] {
  if (!Array.isArray(partsData)) {
    console.warn('Parts data is not an array:', partsData);
    return [];
  }
  
  return partsData.map((part: any, index: number) => {
    // Ensure the part has a valid ID
    if (!part.id || part.id === '') {
      console.warn(`Part at index ${index} has no valid id:`, part);
      
      // Try to generate a valid ID
      let generatedId = '';
      
      // If part has a name, use it as ID (temporary solution)
      if (part.name) {
        generatedId = part.name;
      } else {
        // Fallback to index-based ID
        generatedId = `temp-id-${index}`;
      }
      
      return {
        ...part,
        id: generatedId
      };
    }
    
    return part;
  });
}

/**
 * Validate if a part ID is valid (not empty and exists in parts list)
 */
export function validatePartId(partId: string, parts: ProjectPart[]): boolean {
  if (!partId || partId.trim() === '') {
    return false;
  }
  
  const partExists = parts.find(part => part.id === partId);
  return !!partExists;
} 