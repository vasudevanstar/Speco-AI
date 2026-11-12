import { NextRequest, NextResponse } from 'next/server';
import { subscriptionRecommendationService } from '@/lib/services/subscription-recommendation.service';
import { Project, Module, Question } from '@/lib/db/models';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    let projectInput = body;

    // If projectId is passed, retrieve the actual database record for high fidelity
    if (body.projectId) {
      const dbProject = (await Project.findById(body.projectId)) as any;
      if (dbProject) {
        const modules = (await Module.findAll({
          where: { projectId: dbProject.id },
          include: [{ model: Question }],
        })) as any[];

        let questionsCount = 0;
        modules.forEach(m => {
          questionsCount += (m.questions || m.Questions || []).length;
        });

        projectInput = {
          title: dbProject.title,
          description: dbProject.description,
          industry: dbProject.industry,
          scale: dbProject.scale,
          projectTypes: typeof dbProject.projectTypes === 'string' ? JSON.parse(dbProject.projectTypes) : dbProject.projectTypes,
          userVolume: dbProject.userVolume,
          userVolumeType: dbProject.userVolumeType,
          constraints: dbProject.constraints,
          modulesCount: modules.length,
          requirementsCount: questionsCount,
        };
      }
    }

    if (!projectInput.title && !projectInput.description) {
      return NextResponse.json(
        { success: false, error: 'Project title and description or a valid projectId are required' },
        { status: 400 }
      );
    }

    const recommendation = await subscriptionRecommendationService.recommendPlan(projectInput);

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error: any) {
    console.error('Error in plan recommendation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}

