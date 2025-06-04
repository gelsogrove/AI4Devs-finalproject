import { Prisma } from '@prisma/client';

// Estendi i tipi di Prisma per supportare tagsJson
declare global {
  namespace PrismaJson {
    // Estensione per il Product
    interface ProductGetPayload extends Prisma.ProductGetPayload<{}> {
      tagsJson: string;
      tags?: string[];
    }

    // Estensione per il FAQ
    interface FAQGetPayload extends Prisma.FAQGetPayload<{}> {
      tagsJson: string;
      tags?: string[];
    }

    // Estensione per il Service
    interface ServiceGetPayload extends Prisma.ServiceGetPayload<{}> {
      tagsJson: string;
      tags?: string[];
    }
  }
}

// Add tagsJson properties to input types
declare module '@prisma/client' {
  interface Product {
    tagsJson: string;
    tags?: string[];
  }

  interface FAQ {
    tagsJson: string;
    tags?: string[];
  }

  interface Service {
    tagsJson: string;
    tags?: string[];
  }

  namespace Prisma {
    interface ProductCreateInput {
      tagsJson?: string;
    }

    interface ProductUpdateInput {
      tagsJson?: string;
    }

    interface FAQCreateInput {
      tagsJson?: string;
    }

    interface FAQUpdateInput {
      tagsJson?: string;
    }

    interface ServiceCreateInput {
      tagsJson?: string;
    }

    interface ServiceUpdateInput {
      tagsJson?: string;
    }
  }
}

export { };
