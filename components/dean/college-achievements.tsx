'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';

function isWithinOneMonthOfYearEnd(): boolean {
   const now = new Date()
   const currentYear = now.getFullYear()
   const yearEnd = new Date(currentYear, 11, 31) // December 31st of current year
   const oneMonthBeforeYearEnd = new Date(currentYear, 11, 1) // December 1st of current year

   return now >= oneMonthBeforeYearEnd && now <= yearEnd
 }

function shouldEnableEvaluationButton(status: string): boolean {
    // Button should be disabled for "new" or "complete" status
    // Only enable for "new" status AND within one month of year end
    if (status === "complete") return false
    if (status === "new") return isWithinOneMonthOfYearEnd()
    return true // Disable for all other statuses
  }

function getEvaluationTooltip(status: string): string {
    if (shouldEnableEvaluationButton(status)) {
      return "Open appraisal for evaluation"
    }
    if (status === "new" && !isWithinOneMonthOfYearEnd()) {
      return "Evaluation can only be done one month before year end"
    }
    if (status === "complete") {
      return "Evaluation is complete and cannot be modified"
    }
    return "Evaluation is not available for this status"
  }


export default function CollegeAchievements() {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', search: '' });
    const debouncedSearch = useDebounce(filters.search, 300);

    useEffect(() => {
        const fetchAchievements = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const res = await fetch(`/api/dean/achievements?${params.toString()}`);
            const data = await res.json();
            setAchievements(data.achievements || []);
            setLoading(false);
        };
        fetchAchievements();
    }, [filters.type, debouncedSearch]);

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Faculty Achievements (College-Wide)</CardTitle>
                    <CardDescription>Cross-college aggregation of faculty achievements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <Input 
                            placeholder="Search by title..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="max-w-sm"
                        />
                        <div className="flex gap-2">
                            <Select value={filters.type} onValueChange={(v) => setFilters(prev => ({ ...prev, type: v === 'all' ? '' : v }))}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Award">Awards</SelectItem>
                                    <SelectItem value="Research">Research</SelectItem>
                                    {/* Add other types as they are implemented in the API */}
                                </SelectContent>
                            </Select>
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Source</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                ) : achievements.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No achievements found.</TableCell></TableRow>
                                ) : (
                                    achievements.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.faculty}</TableCell>
                                            <TableCell>{item.department}</TableCell>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    window.open(`/dean/view/${item.appraisalId}`, '_blank')
                                                                }}
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{getEvaluationTooltip(item.status)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
