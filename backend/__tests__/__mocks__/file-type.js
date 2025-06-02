// Mock for file-type module to resolve ES module import issues in Jest tests

module.exports = {
  fileTypeFromBuffer: jest.fn().mockImplementation(async (buffer) => {
    // Mock implementation that returns a PDF file type for any buffer
    return {
      ext: 'pdf',
      mime: 'application/pdf'
    };
  }),
  
  fileTypeFromStream: jest.fn().mockImplementation(async (stream) => {
    return {
      ext: 'pdf',
      mime: 'application/pdf'
    };
  }),
  
  // Export as both named and default exports to cover all use cases
  default: {
    fileTypeFromBuffer: jest.fn().mockImplementation(async (buffer) => {
      return {
        ext: 'pdf',
        mime: 'application/pdf'
      };
    })
  }
}; 