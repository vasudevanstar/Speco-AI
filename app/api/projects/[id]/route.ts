import { expressAdapter } from "@/lib/next-adapter";
import { ProjectController, QuestionnaireController, FRDController } from "@/lib/controllers";

const projectController = new ProjectController();
const questionnaireController = new QuestionnaireController();
const frdController = new FRDController();

export const GET = expressAdapter(projectController.getById.bind(projectController), true);
export const PUT = expressAdapter(projectController.update.bind(projectController), true);
export const DELETE = expressAdapter(projectController.delete.bind(projectController), true);
