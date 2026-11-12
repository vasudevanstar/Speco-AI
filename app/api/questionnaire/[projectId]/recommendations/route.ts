import { NextResponse } from 'next/server';
import { Project, Question } from '@/lib/db/models';
import { aiService } from '@/lib/ai/ai.service';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const body = await req.json();
    const { questionId } = body;
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const project = await (Project as any).findById(params.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const question = await (Question as any).findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const projectData = project.toJSON ? project.toJSON() : project;
    const questionText = (question as any).question || '';

    const recommendations = await aiService.generateExtraRequirementsRecommendations(projectData as any, questionText);

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({
      recommendations: [
        "Enforce strict input validation and field length constraints across all interfaces.",
        "Implement real-time visual validation feedback with clear user-friendly guidance.",
        "Include comprehensive audit trails and role-based action permissions.",
        "Ensure responsive multi-device layouts with automated retry mechanisms."
      ]
    });
  }
}
