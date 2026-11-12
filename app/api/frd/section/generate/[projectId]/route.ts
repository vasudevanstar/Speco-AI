import { expressAdapter } from "@/lib/next-adapter";
import { FRDController } from "@/lib/controllers";

const frdController = new FRDController();

export const POST = expressAdapter(frdController.regenerateSection.bind(frdController));
