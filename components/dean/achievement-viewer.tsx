'use client'

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ExternalLink } from 'lucide-react';

// A generic function to render a table for any achievement type
const renderTable = (title: string, data: any[], columns: { key: string; label: string }[], setSelectedItem: (item: any) => void) => (
    <AccordionItem value={title.toLowerCase()}>
        <AccordionTrigger>{title} ({data.length})</AccordionTrigger>
        <AccordionContent>
            {data.length > 0 ? (
                <Table>
                    <TableHeader><TableRow>{columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}<TableHead className="text-right">Details</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index}>
                                {columns.map(c => <TableCell key={c.key}>{item[c.key]?.toString() ?? '-'}</TableCell>)}
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>View</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : <p className="text-sm text-muted-foreground px-4">No items submitted.</p>}
        </AccordionContent>
    </AccordionItem>
);

export default function AchievementViewer({ appraisal }: { appraisal: any }) {
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const achievementSections = [
        { title: 'Awards', data: appraisal.awards, columns: [{key: 'name', label: 'Name'}, {key: 'organization', label: 'Organization'}, {key: 'dateObtained', label: 'Date'}] },
        { title: 'Courses Taught', data: appraisal.courses, columns: [{key: 'courseTitle', label: 'Title'}, {key: 'courseCode', label: 'Code'}, {key: 'studentsEvalAvg', label: 'Student Eval Avg.'}] },
        { title: 'Research Activities', data: appraisal.researchActivities, columns: [{key: 'title', label: 'Title'}, {key: 'kind', label: 'Kind'}, {key: 'publicationDate', label: 'Date'}] },
        { title: 'Scientific Activities', data: appraisal.scientificActivities, columns: [{key: 'title', label: 'Title'}, {key: 'type', label: 'Type'}, {key: 'participation', label: 'Participation'}] },
        { title: 'University Services', data: appraisal.universityServices, columns: [{key: 'committeeOrTask', label: 'Task'}, {key: 'authority', label: 'Authority'}, {key: 'participation', label: 'Participation'}] },
        { title: 'Community Services', data: appraisal.communityServices, columns: [{key: 'committeeOrTask', label: 'Task'}, {key: 'authority', label: 'Authority'}, {key: 'participation', label: 'Participation'}] },
    ];

    return (
        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
            <Accordion type="single" collapsible className="w-full">
                {achievementSections.map(section => (
                    <div key={section.title}>
                        {renderTable(section.title, section.data, section.columns, setSelectedItem)}
                    </div>
                ))}
            </Accordion>

            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Achievement Details</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-2">
                    {selectedItem && Object.entries(selectedItem).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                            <strong className="capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}</strong>
                            <span className="col-span-2">{value?.toString() ?? 'N/A'}</span>
                        </div>
                    ))}
                    {selectedItem?.fileUrl && (
                        <Button asChild className="mt-4">
                            <a href={selectedItem.fileUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> View Attachment
                            </a>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
