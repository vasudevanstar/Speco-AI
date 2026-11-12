import { expressAdapter } from "@/lib/next-adapter";
import { ProjectController, QuestionnaireController, FRDController } from "@/lib/controllers";

const projectController = new ProjectController();
const questionnaireController = new QuestionnaireController();
const frdController = new FRDController();

export const GET = expressAdapter(frdController.exportMarkdown.bind(frdController));
