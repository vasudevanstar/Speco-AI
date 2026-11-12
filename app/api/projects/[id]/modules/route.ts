import { expressAdapter } from "@/lib/next-adapter";
import { ProjectController } from "@/lib/controllers";

const projectController = new ProjectController();

export const POST = expressAdapter(projectController.addCustomModule.bind(projectController));
