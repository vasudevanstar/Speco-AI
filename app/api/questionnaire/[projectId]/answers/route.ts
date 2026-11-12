import { expressAdapter } from "@/lib/next-adapter";
import { ProjectController, QuestionnaireController, FRDController } from "@/lib/controllers";

const projectController = new ProjectController();
const questionnaireController = new QuestionnaireController();
const frdController = new FRDController();

export const GET = expressAdapter(questionnaireController.getAnswers.bind(questionnaireController));
