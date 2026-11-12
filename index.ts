#!/usr/bin/env node

import * as readline from 'readline';
import { FRDGenerator } from './utils/frd-generator';
import { mcqSections } from './data/mcq-questions';
import { ProjectAnswers, MCQQuestion } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { Project } from './lib/db/models';

class FRDSurvey {
  private rl: readline.Interface;
  private answers: ProjectAnswers = {};
  private currentSection = 0;
  private currentQuestion = 0;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private question(query: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  private printHeader(text: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${text}`);
    console.log('='.repeat(60));
  }

  private printSubHeader(text: string) {
    console.log('\n' + '-'.repeat(40));
    console.log(`  ${text}`);
    console.log('-'.repeat(40));
  }

  private shouldShowQuestion(question: MCQQuestion): boolean {
    if (!question.dependsOn) return true;
    
    const parentAnswer = this.answers[question.dependsOn.questionId];
    if (Array.isArray(parentAnswer)) {
      return question.dependsOn.values.some(v => parentAnswer.includes(v));
    }
    return question.dependsOn.values.includes(parentAnswer as string);
  }

  private async handleYesNo(question: MCQQuestion): Promise<string> {
    while (true) {
      const answer = await this.question(`  ${question.question} (yes/no): `);
      const normalized = answer.toLowerCase().trim();
      if (normalized === 'yes' || normalized === 'y') {
        this.answers[question.id] = 'yes';
        return 'yes';
      } else if (normalized === 'no' || normalized === 'n') {
        this.answers[question.id] = 'no';
        return 'no';
      } else {
        console.log('  Please enter "yes" or "no"');
      }
    }
  }

  private async handleSingleSelect(question: MCQQuestion): Promise<string> {
    console.log(`\n  ${question.question}`);
    if (question.description) {
      console.log(`  ${question.description}`);
    }
    console.log('');

    question.options!.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt.label}`);
      if (opt.description) {
        console.log(`     ${opt.description}`);
      }
    });

    while (true) {
      const input = await this.question('\n  Enter option number: ');
      const num = parseInt(input);
      if (num >= 1 && num <= question.options!.length) {
        const selected = question.options![num - 1].value;
        this.answers[question.id] = selected;
        return selected;
      } else {
        console.log('  Please enter a valid option number');
      }
    }
  }

  private async handleMultipleSelect(question: MCQQuestion): Promise<string[]> {
    console.log(`\n  ${question.question}`);
    if (question.description) {
      console.log(`  ${question.description}`);
    }
    console.log('  (Select multiple by entering comma-separated numbers, e.g., 1,3,5)');
    console.log('  (Enter "0" to skip or "all" to select all)\n');

    question.options!.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt.label}`);
      if (opt.description) {
        console.log(`     ${opt.description}`);
      }
    });

    while (true) {
      const input = await this.question('\n  Enter option numbers: ');
      const trimmed = input.trim().toLowerCase();

      if (trimmed === '0' || trimmed === 'skip' || trimmed === '') {
        this.answers[question.id] = [];
        return [];
      }

      if (trimmed === 'all') {
        const allValues = question.options!.map(o => o.value);
        this.answers[question.id] = allValues;
        return allValues;
      }

      const nums = trimmed.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      
      if (nums.every(n => n >= 1 && n <= question.options!.length)) {
        const selected = nums.map(n => question.options![n - 1].value);
        this.answers[question.id] = selected;
        return selected;
      } else {
        console.log('  Please enter valid option numbers (e.g., 1,3,5)');
      }
    }
  }

  private async handleNumber(question: MCQQuestion): Promise<number> {
    console.log(`\n  ${question.question}`);
    if (question.description) {
      console.log(`  ${question.description}`);
    }
    console.log('');

    if (question.options) {
      question.options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.label}`);
        if (opt.description) console.log(`     ${opt.description}`);
      });
      while (true) {
        const input = await this.question('\n  Enter option number: ');
        const num = parseInt(input);
        if (num >= 1 && num <= question.options.length) {
          const value = parseInt(question.options[num - 1].value);
          this.answers[question.id] = value;
          return value;
        } else {
          console.log('  Please enter a valid option number');
        }
      }
    }

    while (true) {
      const input = await this.question('  Enter value: ');
      const num = parseInt(input);
      if (!isNaN(num)) {
        this.answers[question.id] = num;
        return num;
      } else {
        console.log('  Please enter a valid number');
      }
    }
  }

  private async handleText(question: MCQQuestion): Promise<string> {
    console.log(`\n  ${question.question}`);
    if (question.description) {
      console.log(`  ${question.description}`);
    }

    const input = await this.question('  Enter value: ');
    this.answers[question.id] = input;
    return input;
  }

  private async askQuestion(question: MCQQuestion): Promise<void> {
    if (!this.shouldShowQuestion(question)) {
      return;
    }

    switch (question.type) {
      case 'yesno':
        await this.handleYesNo(question);
        break;
      case 'single':
        await this.handleSingleSelect(question);
        break;
      case 'multiple':
        await this.handleMultipleSelect(question);
        break;
      case 'number':
        await this.handleNumber(question);
        break;
      case 'text':
        await this.handleText(question);
        break;
      default:
        console.log(`  Unsupported question type: ${question.type}`);
    }
  }

  private async runSection(sectionIndex: number): Promise<void> {
    const section = mcqSections[sectionIndex];
    this.printHeader(`${section.moduleName}`);

    for (const question of section.questions) {
      if (this.shouldShowQuestion(question)) {
        await this.askQuestion(question);
      }
    }
  }

  public async start(): Promise<void> {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║        FUNCTIONAL REQUIREMENTS DOCUMENT (FRD) GENERATOR       ║');
    console.log('║                                                              ║');
    console.log('║        Shop/Retail Management System Survey                  ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n  This survey will help generate a comprehensive FRD for your project.');
    console.log('  Please answer the questions to define your requirements.\n');

    const projectDescription = await this.question('  Enter project description: ');
    const constraints = await this.question('  Enter any constraints (optional, comma-separated): ');

    this.printHeader('Project Context');
    console.log(`\n  Project: ${projectDescription}`);
    if (constraints) {
      console.log(`  Constraints: ${constraints}`);
    }

    for (let i = 0; i < mcqSections.length; i++) {
      const section = mcqSections[i];
      
      const proceed = await this.question(
        `\n  ─────────────────────────────────────────────────────────\n` +
        `  [${i + 1}/${mcqSections.length}] ${section.moduleName}\n` +
        `  ─────────────────────────────────────────────────────────\n` +
        `  Press ENTER to continue or 'skip' to skip this section: `
      );

      if (proceed.toLowerCase() !== 'skip') {
        await this.runSection(i);
      } else {
        console.log('  Section skipped.');
      }
    }

    this.printHeader('Generating FRD...');
    console.log('\n  Processing your requirements...\n');

    const generator = new FRDGenerator(projectDescription, constraints, this.answers);
    const frd = generator.generate();
    const markdown = generator.toMarkdown();

    const frdDir = path.join(process.cwd(), 'FRD');
    if (!fs.existsSync(frdDir)) {
      fs.mkdirSync(frdDir, { recursive: true });
    }
    const outputPath = path.join(frdDir, `FRD_${frd.metadata.documentId}.md`);
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`\n  ✓ Local Markdown generated successfully!`);
    console.log(`  ✓ Output saved to: ${outputPath}`);

    try {
      console.log('\n  Saving to MySQL Database...');
      const project = await Project.create({
        title: projectDescription.substring(0, 50) || 'CLI Generated Project',
        description: projectDescription,
        constraints: constraints,
        status: 'completed'
      } as any) as any;

      await generator.saveToDatabase(project.id);
      console.log(`  ✓ Database save successful! (Project ID: ${project.id})`);
    } catch (dbError) {
      console.error(`\n  ✗ Failed to save to database:`, dbError);
    }

    console.log(`\n  Document Summary:`);
    console.log(`  - Modules covered: ${frd.modules.length}`);
    console.log(`  - Functional requirements: ${frd.functionalRequirements.length}`);
    console.log(`  - User flows: ${frd.userFlows.length}`);
    console.log(`  - Integrations: ${frd.integrations.length}`);

    this.rl.close();
  }
}

const survey = new FRDSurvey();
survey.start().catch(console.error);
