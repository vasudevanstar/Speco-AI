'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Printer, Loader2, CheckCircle, Users, Package, CreditCard, BarChart3, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FRDViewerProps {
  projectId: string;
  frdData: any;
}

export function FRDViewer({ projectId, frdData }: FRDViewerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/frd/export-pdf/${projectId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FRD_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/frd/export-markdown/${projectId}`);
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FRD_${projectId}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const { content, requirements, userFlows, decisions, integrations } = frdData;

  const getModuleIcon = (moduleName: string) => {
    const name = moduleName.toLowerCase();
    if (name.includes('auth')) return <Settings className="h-4 w-4" />;
    if (name.includes('user') || name.includes('role')) return <Users className="h-4 w-4" />;
    if (name.includes('billing') || name.includes('order')) return <CreditCard className="h-4 w-4" />;
    if (name.includes('inventory') || name.includes('product')) return <Package className="h-4 w-4" />;
    if (name.includes('report') || name.includes('analytics')) return <BarChart3 className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Functional Requirements Document</CardTitle>
              <CardDescription>
                Version {frdData.version || '1.0.0'} • Generated on{' '}
                {new Date(frdData.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExportMarkdown} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Markdown
              </Button>
              <Button onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{content?.projectOverview?.description}</p>
              </div>
              
              {content?.projectOverview?.constraints?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Constraints</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {content.projectOverview.constraints.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {content?.projectOverview?.objectives?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Objectives</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {content.projectOverview.objectives.map((o: string, i: number) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Modules</CardTitle>
                {getModuleIcon('modules')}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {content?.modules?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total modules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requirements?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Functional requirements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">User Flows</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userFlows?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Defined flows</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {content?.modules?.map((module: any, index: number) => (
              <AccordionItem key={index} value={`module-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {getModuleIcon(module.module)}
                    <span>{module.module}</span>
                    <Badge variant="secondary">
                      {module.subModules?.length || 0} sub-modules
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-6">
                    <p className="text-muted-foreground">{module.description}</p>
                    
                    {module.subModules?.map((sub: any, subIndex: number) => (
                      <div key={subIndex} className="border-l-2 pl-4">
                        <h4 className="font-medium">{sub.name}</h4>
                        {sub.features?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {sub.features.map((f: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Functional Requirements</CardTitle>
              <CardDescription>
                {requirements?.length || 0} requirements defined
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requirements?.map((req: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Badge
                      variant={
                        req.priority === 'Must Have'
                          ? 'destructive'
                          : req.priority === 'Should Have'
                          ? 'default'
                          : 'secondary'
                      }
                      className="shrink-0"
                    >
                      {req.code}
                    </Badge>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{req.requirement}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {req.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {req.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          {userFlows?.map((flow: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{flow.code}</CardTitle>
                  <CardTitle>{flow.name}</CardTitle>
                </div>
                <CardDescription>{flow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flow.steps?.map((step: any, stepIndex: number) => (
                    <div key={stepIndex} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {step.step}
                        </div>
                        {stepIndex < flow.steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">{step.action}</div>
                        <div className="text-sm text-muted-foreground">
                          Actor: {step.actor}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          System: {step.system}
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          Result: {step.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision Summary</CardTitle>
              <CardDescription>
                All answers and decisions captured during the questionnaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {decisions?.map((decision: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 py-2 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{decision.question}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{decision.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations?.map((integration: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant={integration.required ? 'destructive' : 'secondary'}>
                      {integration.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  <CardDescription>{integration.category}</CardDescription>
                </CardHeader>
                {integration.configuration?.length > 0 && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Configuration:</p>
                    <ul className="mt-2 space-y-1">
                      {integration.configuration.map((c: any, i: number) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{c.key}:</span>{' '}
                          <span className="text-muted-foreground">{c.value || '(not set)'}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
