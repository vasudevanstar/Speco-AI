// @ts-nocheck
import { Request, Response } from 'express';
import { User, Project, Module, SubModule, Question, Answer, FRDDocument, FunctionalRequirement } from '../db/models';
import { aiService } from '../ai/ai.service';
import { frdGenerator } from '../services/frd-generator.service';
import { subscriptionService } from '../services/subscription.service';

export class ProjectController {
  private getUserId(req: Request): string | null {
    return (req as any).user?.id || (req as any).body?.userId || (req as any).query?.userId || null;
  }

  private async getValidUserId(req: Request): Promise<string | null> {
    const rawId = (req as any).user?.id || (req as any).body?.userId || (req as any).query?.userId || null;
    if (!rawId) return null;
    try {
      const [user] = await User.findOrCreate({
        where: { id: rawId },
        defaults: {
          id: rawId,
          email: (req as any).user?.email || `${rawId}@example.com`,
          name: (req as any).user?.name || 'User',
          password: 'noopassword',
        },
      });
      return user?.id || null;
    } catch (e) {
      return null;
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = await this.getValidUserId(req);
      const { title, description, constraints, industry, projectTypes, scale, userVolume, userVolumeType } = req.body;

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required' });
        return;
      }

      // Check project storage subscription quota
      const quotaCheck = await subscriptionService.checkAccess(userId, 'project_storage');
      if (!quotaCheck.allowed) {
        res.status(403).json({
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason,
          upgradeRequired: true,
          planId: quotaCheck.planId,
        });
        return;
      }

      const project = await Project.create({
        title,
        description,
        constraints,
        industry,
        projectTypes: projectTypes || [],
        scale: scale || 'small',
        userVolume: userVolume || null,
        userVolumeType: userVolumeType || 'monthly',
        userId,
        status: 'draft',
      } as any) as any;

      await subscriptionService.recordUsage(userId, 'project_storage', 1);

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Create Project Error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const projects = await Project.findAll({
        include: [
          { model: Module },
          { model: FRDDocument },
        ],
        order: [['created_at', 'DESC']],
      }) as any[];

      res.json({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error) {
      console.error('Get Projects Error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      const project = await Project.findById(id, {
        include: [
          {
            model: Module,
            include: [
              { model: SubModule },
              { model: Question },
            ],
          },
          { model: FRDDocument },
        ],
      }) as any;

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const answers = await Answer.findAll({
        where: { projectId: id },
      }) as any[];

      res.json({
        success: true,
        data: { ...project.toJSON(), answers },
      });
    } catch (error: any) {
      console.error('Get Project Error:', error);
      res.status(500).json({ error: 'Failed to fetch project: ' + error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const updates = req.body;

      const project = await Project.findById(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      delete updates.id;
      delete updates.userId;
      await project.update(updates);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Update Project Error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      const project = await Project.findById(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      await project.destroy();

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete Project Error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  async generateModules(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      const project = await Project.findById(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      let projectTypes = project.projectTypes;
      if (typeof projectTypes === 'string') {
        try {
          projectTypes = JSON.parse(projectTypes);
        } catch {
          projectTypes = [projectTypes];
        }
      }
      if (!Array.isArray(projectTypes)) {
        projectTypes = projectTypes ? [projectTypes] : [];
      }

      const projectData = {
        title: project.title,
        description: project.description,
        constraints: project.constraints || undefined,
        industry: project.industry || undefined,
        scale: project.scale,
        projectTypes,
        userVolume: project.userVolume,
        userVolumeType: project.userVolumeType,
      };

      // Remove existing AI-generated modules to prevent duplicates when regenerating
      await Module.destroy({
        where: { projectId: id, isCustom: false }
      });

      const generatedModules = await aiService.generateModules(projectData);

      const modules = await Promise.all(
        generatedModules.map(async (mod: any, index: number) => {
          const module = await Module.create({
            projectId: id,
            name: mod.name,
            description: mod.description,
            order: index,
            isCustom: false,
          } as any) as any;

          await Promise.all(
            (mod.subModules || []).map(async (sub: any, subIndex: number) => {
              await SubModule.create({
                moduleId: module.id,
                name: sub.name,
                description: sub.description,
                order: subIndex,
              } as any);
            })
          );

          return module;
        })
      );

      await project.update({ status: 'in_progress' });

      const fullModules = await Module.findAll({
        where: { projectId: id },
        include: [{ model: SubModule }],
        order: [['order', 'ASC']],
      }) as any[];

      res.json({
        success: true,
        data: fullModules,
      });
    } catch (error) {
      console.error('Generate Modules Error:', error);
      res.status(500).json({ error: 'Failed to generate modules' });
    }
  }

  async addCustomModule(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { name, description } = req.body;

      const project = await Project.findById(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const existingModules = await Module.count({ where: { projectId: id } });

      const module = await Module.create({
        projectId: id,
        name,
        description,
        order: existingModules,
        isCustom: true,
        status: 'pending'
      } as any);

      try {
        const generatedQuestions = await aiService.generateQuestions(
          { id: module.id, name, description },
          [],
          {
            title: project.title || undefined,
            description: project.description || undefined,
            industry: project.industry || undefined,
            scale: project.scale,
            projectTypes: project.projectTypes,
            userVolume: project.userVolume,
            userVolumeType: project.userVolumeType,
            constraints: project.constraints || undefined,
          }
        );
        
        await Promise.all(
          generatedQuestions.map(async (q: any, index: number) => {
            return Question.create({
              moduleId: module.id,
              question: q.question,
              description: q.description,
              type: q.type,
              options: q.options || [],
              dependsOn: q.dependsOn,
              triggers: q.triggers,
              required: q.required ?? true,
              order: index,
            } as any);
          })
        );

        const moduleWithQuestions = await Module.findOne({
          where: { id: module.id },
          include: [{ model: Question }]
        });

        res.json({
          success: true,
          data: moduleWithQuestions || module,
        });
      } catch (err) {
        console.error('Failed to generate questions for custom module', err);
        res.json({
          success: true,
          data: module,
        });
      }
    } catch (error) {
      console.error('Add Custom Module Error:', error);
      res.status(500).json({ error: 'Failed to add custom module' });
    }
  }
}

export class QuestionnaireController {
  private async verifyProjectOwnership(projectId: string, userId: string | null): Promise<{ project: any; error?: { status: number; message: string } }> {
    const project = await Project.findById(projectId) as any;
    if (!project) {
      return { project: null, error: { status: 404, message: 'Project not found' } };
    }

    return { project };
  }

  private validateOptions(options: any, type?: string): any[] {
    const choiceTypes = ['single', 'multiple', 'select', 'yesno'];
    if (!Array.isArray(options)) return [];
    
    if (type && !choiceTypes.includes(type)) {
      return [];
    }

    const validated: any[] = [];
    const seenValues = new Set<string>();
    
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (typeof opt !== 'object' || !opt) continue;
      
      const label = String(opt.label || opt.value || '').trim();
      const value = String(opt.value || label || '').trim();
      
      if (!label || !value) {
        throw new Error(`Empty label or value at index ${i}`);
      }
      if (seenValues.has(value)) {
        throw new Error(`Duplicate option value "${value}" at index ${i}`);
      }
      
      seenValues.add(value);
      const isOptionActive = opt.isActive === false ? false : true;
      validated.push({
        value,
        label,
        description: opt.description ? String(opt.description).trim() : undefined,
        isActive: isOptionActive,
      });
      
      if (validated.length >= 20) break;
    }
    
    return validated;
  }

  async generateQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, moduleId } = req.body;

      const module = await Module.findById(moduleId, {
        include: [{ model: SubModule }],
      }) as any;

      if (!module) {
        res.status(404).json({ error: 'Module not found' });
        return;
      }

      const project = await Project.findById(projectId) as any;
      const existingQuestions = await Question.findAll({
        where: { moduleId },
        order: [['order', 'ASC']],
      }) as any[];

      if (existingQuestions.length > 0) {
        res.json({
          success: true,
          data: existingQuestions,
          cached: true,
        });
        return;
      }

      const subModules = module.subModules || [];
      const moduleData = {
        id: module.id,
        name: module.name,
        description: module.description || undefined,
        subModules: subModules,
      };

      const generatedQuestions = await aiService.generateQuestions(
        moduleData,
        subModules.map((s: any) => ({ name: s.name })),
        {
          title: project?.title || undefined,
          description: project?.description || undefined,
          industry: project?.industry || undefined,
          scale: project?.scale,
          projectTypes: project?.projectTypes,
          userVolume: project?.userVolume,
          userVolumeType: project?.userVolumeType,
          constraints: project?.constraints || undefined,
        }
      );

      const questions = await Promise.all(
        generatedQuestions.map(async (q: any, index: number) => {
          return Question.create({
            moduleId,
            question: q.question,
            description: q.description,
            type: q.type,
            options: q.options || [],
            dependsOn: q.dependsOn,
            triggers: q.triggers,
            required: q.required ?? true,
            order: index,
          } as any);
        })
      ) as any[];

      res.json({
        success: true,
        data: questions,
        cached: false,
      });
    } catch (error) {
      console.error('Generate Questions Error:', error);
      res.status(500).json({ error: 'Failed to generate questions' });
    }
  }

  async generateQuestionsForProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const modules = await Module.findAll({
        where: { projectId },
        include: [{ model: SubModule }],
        order: [['order', 'ASC']],
      }) as any[];

      if (modules.length === 0) {
        res.status(400).json({ error: 'No modules found. Please generate modules first.' });
        return;
      }

      console.log(`Generating questions for ${modules.length} modules`);
      const allQuestions: any[] = [];

      for (const module of modules) {
        console.log(`Processing module: ${module.name}`);
        // Remove existing questions before generating new ones to prevent returning old ones on regenerate
        await Question.destroy({
          where: { moduleId: module.id }
        });

        const moduleData = {
          id: module.id,
          name: module.name,
          description: module.description || undefined,
        };
        const subModules = module.subModules || [];

        console.log(`Calling AI service for module: ${module.name}`);
        const generatedQuestions = await aiService.generateQuestions(
          moduleData,
          subModules.map((s: any) => ({ name: s.name })),
          {
            title: project.title || undefined,
            description: project.description || undefined,
            industry: project.industry || undefined,
            scale: project.scale,
            projectTypes: project.projectTypes,
            userVolume: project.userVolume,
            userVolumeType: project.userVolumeType,
            constraints: project.constraints || undefined,
          }
        );

        console.log(`Generated ${generatedQuestions.length} questions for ${module.name}`);

        const questions = await Promise.all(
          generatedQuestions.map(async (q: any, index: number) => {
            return Question.create({
              moduleId: module.id,
              question: q.question,
              description: q.description,
              type: q.type,
              options: q.options || [],
              dependsOn: q.dependsOn,
              triggers: q.triggers,
              required: q.required ?? true,
              order: index,
            } as any);
          })
        ) as any[];

        allQuestions.push(...questions);
      }

      console.log(`Total questions generated: ${allQuestions.length}`);
      res.json({
        success: true,
        data: allQuestions,
        count: allQuestions.length,
      });
    } catch (error) {
      console.error('Generate Questions For Project Error:', error);
      res.status(500).json({ error: 'Failed to generate questions' });
    }
  }

  async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const modules = await Module.findAll({
        where: { projectId },
        include: [
          {
            model: Question,
            order: [['order', 'ASC']],
          },
        ],
        order: [['order', 'ASC']],
      }) as any[];

      const answers = await Answer.findAll({
        where: { projectId },
      }) as any[];

      res.json({
        success: true,
        data: modules,
        answers,
      });
    } catch (error) {
      console.error('Get Questions Error:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }

  async saveAnswers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || null;
      const { projectId } = req.params;
      const { answers } = req.body;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      await Promise.all(
        answers.map(async (ans: any) => {
          const [answer, created] = await Answer.findOrCreate({
            where: { projectId, questionId: ans.questionId },
            defaults: {
              selectedOptions: ans.selectedOptions || [],
              textValue: ans.textValue,
              numericValue: ans.numericValue,
              additionalExplanation: ans.additionalExplanation || null,
              history: [],
            },
          }) as any;

          if (!created) {
            const hasChanged = 
              JSON.stringify(ans.selectedOptions || []) !== JSON.stringify(answer.selectedOptions || []) ||
              (ans.textValue !== undefined && ans.textValue !== answer.textValue) ||
              (ans.numericValue !== undefined && ans.numericValue !== answer.numericValue);

            let history = Array.isArray(answer.history) ? [...answer.history] : [];
            if (hasChanged) {
              history.push({
                selectedOptions: answer.selectedOptions,
                textValue: answer.textValue,
                numericValue: answer.numericValue,
                additionalExplanation: answer.additionalExplanation,
                timestamp: new Date().toISOString(),
              });
            }

            await answer.update({
              selectedOptions: ans.selectedOptions || answer.selectedOptions,
              textValue: ans.textValue !== undefined ? ans.textValue : answer.textValue,
              numericValue: ans.numericValue !== undefined ? ans.numericValue : answer.numericValue,
              additionalExplanation: ans.additionalExplanation !== undefined ? ans.additionalExplanation : answer.additionalExplanation,
              history,
            });
          }
        })
      );

      const savedAnswers = await Answer.findAll({
        where: { projectId },
      }) as any[];

      // Recalculate module statuses
      const modules = await Module.findAll({
        where: { projectId },
        include: [{ model: Question }]
      }) as any[];

      for (const module of modules) {
        let answeredRequired = 0;
        let totalRequired = 0;
        let anyAnswered = false;

        const questions = module.Questions || [];
        for (const question of questions) {
          if (question.required !== false) {
            totalRequired++;
          }
          
          const answer = savedAnswers.find((a: any) => a.questionId === question.id);
          const hasAnswer = answer && (
            (answer.selectedOptions && answer.selectedOptions.length > 0) ||
            (answer.textValue && answer.textValue.trim() !== '') ||
            (answer.numericValue !== null && answer.numericValue !== undefined)
          );
          
          if (hasAnswer) {
            anyAnswered = true;
            if (question.required !== false) {
              answeredRequired++;
            }
          }
        }

        let newStatus = 'pending';
        if (questions.length === 0) {
          newStatus = 'pending';
        } else if (totalRequired > 0 && answeredRequired === totalRequired) {
          newStatus = 'completed';
        } else if (totalRequired === 0 && anyAnswered) {
          newStatus = 'completed';
        } else if (anyAnswered) {
          newStatus = 'in_progress';
        }

        if (module.status !== newStatus) {
          await module.update({ status: newStatus });
        }
      }

      res.json({
        success: true,
        data: savedAnswers,
      });
    } catch (error) {
      console.error('Save Answers Error:', error);
      res.status(500).json({ error: 'Failed to save answers' });
    }
  }

  async getAnswers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const answers = await Answer.findAll({
        where: { projectId },
        include: [{ model: Question }],
      }) as any[];

      res.json({
        success: true,
        data: answers,
      });
    } catch (error) {
      console.error('Get Answers Error:', error);
      res.status(500).json({ error: 'Failed to fetch answers' });
    }
  }

  async configureQuestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || null;
      const { projectId } = req.params;
      const { configurations } = req.body;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      if (!Array.isArray(configurations)) {
        res.status(400).json({ error: 'configurations must be an array' });
        return;
      }

      await Promise.all(
        configurations.map(async (config: any) => {
          const question = await Question.findById(config.questionId) as any;
          if (question) {
            const updates: any = {};
            if (config.isActive !== undefined) updates.isActive = config.isActive;
            if (config.isSkippable !== undefined) {
              updates.isSkippable = config.isSkippable;
              updates.required = !config.isSkippable;
            }
            if (config.allowMultiple !== undefined) updates.allowMultiple = config.allowMultiple;
            if (config.allowOther !== undefined) updates.allowOther = config.allowOther;
            if (config.type !== undefined) updates.type = config.type;
            if (config.respondentPrompt !== undefined) {
              const p = config.respondentPrompt;
              updates.respondentPrompt =
                p === null || p === ''
                  ? null
                  : String(p).trim() || null;
            }
            if (config.showRespondentPrompt !== undefined) {
              updates.showRespondentPrompt = !!config.showRespondentPrompt;
            }
            if (config.options !== undefined) {
              try {
                const validatedOptions = this.validateOptions(config.options, question.type);
                updates.options = validatedOptions;
              } catch (e: any) {
                throw new Error(
                  `Question ${config.questionId}: ${e?.message || 'Invalid options'}`
                );
              }
            }
            await question.update(updates);
          }
        })
      );

      // Return updated questions
      const modules = await Module.findAll({
        where: { projectId },
        include: [{ model: Question, order: [['order', 'ASC']] }],
        order: [['order', 'ASC']],
      }) as any[];

      res.json({
        success: true,
        data: modules,
      });
    } catch (error: any) {
      console.error('Configure Questions Error:', error);
      const msg = error?.message || '';
      if (typeof msg === 'string' && msg.includes('Question ') && msg.includes(':')) {
        res.status(400).json({ error: msg });
        return;
      }
      res.status(500).json({ error: 'Failed to configure questions' });
    }
  }
}

export class FRDController {
  private async verifyProjectOwnership(projectId: string, userId: string | null): Promise<{ project: any; error?: { status: number; message: string } }> {
    const project = await Project.findById(projectId) as any;
    if (!project) {
      return { project: null, error: { status: 404, message: 'Project not found' } };
    }

    return { project };
  }

  async generate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      // Verify subscription quota for FRD generation
      const effectiveUserId = project.userId || userId;
      const quotaCheck = await subscriptionService.checkAccess(effectiveUserId, 'frd_generation');
      if (!quotaCheck.allowed) {
        res.status(403).json({
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason,
          upgradeRequired: true,
          planId: quotaCheck.planId,
        });
        return;
      }

      const modules = await Module.findAll({
        where: { projectId },
        include: [
          { model: SubModule },
          { model: Question },
        ],
        order: [['order', 'ASC']],
      }) as any[];

      const answers = await Answer.findAll({
        where: { projectId },
      }) as any[];

      const answerMap: Record<string, any> = {};
      for (const answer of answers) {
        answerMap[answer.questionId] = {
          selectedOptions: answer.selectedOptions,
          textValue: answer.textValue
        };
      }

      let projectTypes = project.projectTypes;
      if (typeof projectTypes === 'string') {
        try {
          projectTypes = JSON.parse(projectTypes);
        } catch {
          projectTypes = [projectTypes];
        }
      }
      if (!Array.isArray(projectTypes)) {
        projectTypes = projectTypes ? [projectTypes] : [];
      }

      const projectData = {
        title: project.title,
        description: project.description,
        constraints: project.constraints || undefined,
        industry: project.industry || undefined,
        scale: project.scale,
        projectTypes,
        userVolume: project.userVolume,
        userVolumeType: project.userVolumeType,
      };

      const modulesData = modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        subModules: m.SubModules || m.subModules || [],
        questions: m.Questions || m.questions || [],
      }));

      const generated = await frdGenerator.generateFRD(projectData, answerMap, modulesData);

      const [frdDocument, created] = await FRDDocument.findOrCreate({
        where: { projectId },
        defaults: {
          content: generated.content,
          markdown: generated.markdown,
          version: '1.0.0',
          status: 'draft',
          history: [],
        },
      }) as any;

      if (!created) {
        const oldVersion = frdDocument.version || '1.0.0';
        const parts = oldVersion.split('.');
        const nextVersion = `${parts[0]}.${parseInt(parts[1] || '0') + 1}.0`;
        const oldHistory = Array.isArray(frdDocument.history) ? frdDocument.history : [];
        const updatedHistory = [
          ...oldHistory,
          {
            version: oldVersion,
            content: frdDocument.content,
            markdown: frdDocument.markdown,
            timestamp: new Date().toISOString(),
          }
        ];

        await frdDocument.update({
          content: JSON.parse(JSON.stringify(generated.content)),
          markdown: generated.markdown,
          version: nextVersion,
          history: updatedHistory,
        });
      }

      // Sync relational FunctionalRequirement records with Developer Hints
      try {
        await FunctionalRequirement.destroy({ where: { frdDocumentId: frdDocument.id } });
        await Promise.all(
          generated.requirements.map(async (r: any) => {
            const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
            await FunctionalRequirement.create({
              frdDocumentId: frdDocument.id,
              moduleId: isUuid(r.moduleId) ? r.moduleId : null,
              questionId: isUuid(r.questionId) ? r.questionId : null,
              code: r.id,
              requirement: r.technicalSpecification || r.requirementDescription,
              developerHint: r.developerHint,
              technicalSpec: r.technicalSpecification,
              validationRules: r.validationRules,
              acceptanceCriteria: r.acceptanceCriteria,
              priority: r.priority,
              type: 'Functional',
              clarificationStatus: r.clarificationStatus,
            });
          })
        );
      } catch (e) {
        console.error('Error syncing FunctionalRequirements records:', e);
      }

      await project.update({ status: 'completed' });
      await subscriptionService.recordUsage(effectiveUserId, 'frd_generation', 1);

      res.json({
        success: true,
        data: {
          frd: frdDocument,
          requirements: generated.requirements,
          userFlows: generated.userFlows,
          decisions: generated.decisions,
          integrations: generated.integrations,
        },
      });
    } catch (error) {
      console.error('Generate FRD Error:', error);
      res.status(500).json({ error: 'Failed to generate FRD' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const frdDocument = await FRDDocument.findOne({
        where: { projectId },
      }) as any;

      if (!frdDocument) {
        res.status(404).json({ error: 'FRD not found. Please generate first.' });
        return;
      }

      // Ensure content is a parsed object (MySQL JSON column may return a string)
      const frdData = frdDocument.toJSON();
      if (typeof frdData.content === 'string') {
        try {
          frdData.content = JSON.parse(frdData.content);
        } catch (e) {
          console.error('Failed to parse FRD content:', e);
        }
      }

      res.json({
        success: true,
        data: frdData,
      });
    } catch (error) {
      console.error('Get FRD Error:', error);
      res.status(500).json({ error: 'Failed to fetch FRD' });
    }
  }

  async exportPDF(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      // Check document export quota
      const effectiveUserId = project.userId || userId;
      const quotaCheck = await subscriptionService.checkAccess(effectiveUserId, 'document_export');
      if (!quotaCheck.allowed) {
        res.status(403).json({
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason,
          upgradeRequired: true,
          planId: quotaCheck.planId,
        });
        return;
      }

      const frdDocument = await FRDDocument.findOne({
        where: { projectId },
      }) as any;

      if (!frdDocument) {
        res.status(404).json({ error: 'FRD not found' });
        return;
      }

      let content = frdDocument.content;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse content in PDF export:', e);
        }
      }

      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_FRD.pdf"`);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', async () => {
        const result = Buffer.concat(chunks);
        await subscriptionService.recordUsage(effectiveUserId, 'document_export', 1);
        res.send(result);
      });

      // Title Page / Header
      doc.fontSize(22).font('Helvetica-Bold').text('Functional Requirements Document', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').text(project.title, { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(10).font('Helvetica').text(`Version: ${frdDocument.version || '1.0.0'}`, { align: 'right' });
      doc.text(`Generated: ${new Date(frdDocument.createdAt).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(1.5);

      // Render 13 Sections
      if (content?.sections && Array.isArray(content.sections)) {
        for (const sec of content.sections) {
          doc.addPage();
          doc.fontSize(16).font('Helvetica-Bold').text(sec.title);
          doc.moveDown(0.8);

          // Clean markdown tokens for simple text rendering
          const plainText = (sec.content || '')
            .replace(/###\s*/g, '')
            .replace(/##\s*/g, '')
            .replace(/\*\*/g, '')
            .replace(/`/g, '');

          doc.fontSize(10).font('Helvetica').text(plainText, {
            lineGap: 4,
          });
        }
      } else {
        // Fallback overview
        doc.fontSize(16).font('Helvetica-Bold').text('1. Project Overview');
        doc.moveDown();
        doc.fontSize(11).font('Helvetica').text(`Description: ${project.description || 'N/A'}`);
        doc.moveDown();
        if (project.constraints) {
          doc.text(`Constraints: ${project.constraints}`);
          doc.moveDown();
        }
      }

      // Render Structured Functional Requirements with Developer Hints
      if (content?.requirements && Array.isArray(content.requirements) && content.requirements.length > 0) {
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').text('Functional Requirements & Developer Hints');
        doc.moveDown(1);

        for (const req of content.requirements) {
          doc.fontSize(13).font('Helvetica-Bold').text(`[${req.code}] ${req.title}`);
          doc.moveDown(0.3);

          if (req.originalQuestion) {
            doc.fontSize(10).font('Helvetica-Bold').text('Source Question: ', { continued: true });
            doc.font('Helvetica').text(req.originalQuestion);
          }
          if (req.originalAnswer) {
            doc.fontSize(10).font('Helvetica-Bold').text('Original User Answer: ', { continued: true });
            doc.font('Helvetica-Bold').text(req.originalAnswer);
          }
          if (req.technicalSpec) {
            doc.fontSize(10).font('Helvetica-Bold').text('Technical Specification: ', { continued: true });
            doc.font('Helvetica').text(req.technicalSpec);
          }
          if (req.developerHint) {
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica-Bold').text('Developer Implementation Hint: ', { continued: true });
            doc.font('Helvetica-Oblique').text(req.developerHint);
          }
          if (req.validationRules && Array.isArray(req.validationRules) && req.validationRules.length > 0) {
            doc.fontSize(10).font('Helvetica-Bold').text('Validation Rules:');
            for (const vRule of req.validationRules) {
              doc.fontSize(9).font('Helvetica').text(`  - ${vRule}`);
            }
          }
          if (req.acceptanceCriteria && Array.isArray(req.acceptanceCriteria) && req.acceptanceCriteria.length > 0) {
            doc.fontSize(10).font('Helvetica-Bold').text('Acceptance Criteria:');
            for (const ac of req.acceptanceCriteria) {
              doc.fontSize(9).font('Helvetica').text(`  [ ] ${ac}`);
            }
          }
          doc.moveDown(0.2);
          doc.fontSize(9).font('Helvetica').text(`Priority: ${req.priority || 'Medium'} | Status: ${req.clarificationStatus || 'Confirmed User Requirement'}`);
          doc.moveDown(1);
        }
      }

      // Render Requirement Traceability Matrix (RTM)
      if (content?.traceabilityMatrix && Array.isArray(content.traceabilityMatrix) && content.traceabilityMatrix.length > 0) {
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').text('Requirement Traceability Matrix (RTM)');
        doc.moveDown(1);

        for (const t of content.traceabilityMatrix) {
          doc.fontSize(11).font('Helvetica-Bold').text(`${t.requirementId} (Question Ref: ${t.questionId})`);
          doc.fontSize(9).font('Helvetica-Bold').text('Question: ', { continued: true });
          doc.font('Helvetica').text(t.questionText);
          doc.fontSize(9).font('Helvetica-Bold').text('Original Answer: ', { continued: true });
          doc.font('Helvetica-Bold').text(t.userAnswer);
          doc.fontSize(9).font('Helvetica-Bold').text('Developer Hint: ', { continued: true });
          doc.font('Helvetica-Oblique').text(t.developerHint);
          doc.fontSize(9).font('Helvetica-Bold').text('Status: ', { continued: true });
          doc.font('Helvetica').text(t.status);
          doc.moveDown(0.8);
        }
      }

      doc.end();
    } catch (error) {
      console.error('Export PDF Error:', error);
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }

  async exportMarkdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || (req as any).query?.userId || null;
      const { projectId } = req.params;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      // Check document export quota
      const effectiveUserId = project.userId || userId;
      const quotaCheck = await subscriptionService.checkAccess(effectiveUserId, 'document_export');
      if (!quotaCheck.allowed) {
        res.status(403).json({
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason,
          upgradeRequired: true,
          planId: quotaCheck.planId,
        });
        return;
      }

      const frdDocument = await FRDDocument.findOne({
        where: { projectId },
      }) as any;

      if (!frdDocument || !frdDocument.markdown) {
        res.status(404).json({ error: 'FRD not found' });
        return;
      }

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_FRD.md"`);

      await subscriptionService.recordUsage(effectiveUserId, 'document_export', 1);
      res.send(frdDocument.markdown);
    } catch (error) {
      console.error('Export Markdown Error:', error);
      res.status(500).json({ error: 'Failed to export Markdown' });
    }
  }

  async regenerateSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || null;
      const { projectId } = req.params;
      const { sectionIndex } = req.body;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const frdDocument = await FRDDocument.findOne({ where: { projectId } }) as any;
      if (!frdDocument) {
        res.status(404).json({ error: 'FRD not found' });
        return;
      }

      let content = frdDocument.content;
      if (typeof content === 'string') content = JSON.parse(content);
      
      const sections = content.sections;
      if (!sections || sectionIndex < 0 || sectionIndex >= sections.length) {
        res.status(400).json({ error: 'Invalid section index' });
        return;
      }

      const section = sections[sectionIndex];
      const projectData = {
        description: project.description,
        industry: project.industry || undefined,
        scale: project.scale,
        constraints: project.constraints || undefined,
      };

      const newContent = await aiService.generateFRDSection(projectData, section.title, section.content);

      res.json({
        success: true,
        data: {
          newContent
        }
      });
    } catch (error) {
      console.error('Regenerate Section Error:', error);
      res.status(500).json({ error: 'Failed to regenerate section' });
    }
  }

  async acceptSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).body?.userId || null;
      const { projectId } = req.params;
      const { sectionIndex, newContent } = req.body;

      const { project, error } = await this.verifyProjectOwnership(projectId, userId);
      if (error || !project) {
        res.status(error?.status || 404).json({ error: error?.message || 'Project not found' });
        return;
      }

      const frdDocument = await FRDDocument.findOne({ where: { projectId } }) as any;
      if (!frdDocument) {
        res.status(404).json({ error: 'FRD not found' });
        return;
      }

      let content = frdDocument.content;
      if (typeof content === 'string') content = JSON.parse(content);

      const sections = content.sections;
      if (!sections || sectionIndex < 0 || sectionIndex >= sections.length) {
        res.status(400).json({ error: 'Invalid section index' });
        return;
      }

      const oldVersionParts = (frdDocument.version || '1.0.0').split('.');
      oldVersionParts[2] = (parseInt(oldVersionParts[2] || '0') + 1).toString();
      const newVersion = oldVersionParts.join('.');

      let history = frdDocument.history;
      if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch (e) { history = []; }
      }
      if (!Array.isArray(history)) history = [];

      history.push({
        version: frdDocument.version,
        updatedAt: new Date(),
        sectionIndex,
        oldContent: sections[sectionIndex].content
      });

      sections[sectionIndex].content = newContent;

      // Ensure content is completely replaced instead of merged by sqlite JSON
      await frdDocument.update({
        content: JSON.parse(JSON.stringify(content)),
        version: newVersion,
        history: JSON.parse(JSON.stringify(history))
      });

      res.json({
        success: true,
        data: {
          version: newVersion,
          content
        }
      });
    } catch (error) {
      console.error('Accept Section Error:', error);
      res.status(500).json({ error: 'Failed to accept section' });
    }
  }
}

export const projectController = new ProjectController();
export const questionnaireController = new QuestionnaireController();
export const frdController = new FRDController();
