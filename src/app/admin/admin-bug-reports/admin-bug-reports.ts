import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { BugReportData } from '../../core/models/session.model';

@Component({
  selector: 'app-admin-bug-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-bug-reports.html'
})
export class AdminBugReports implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  readonly t = inject(TranslationService);

  bugReports: BugReportData[] = [];
  filteredReports: BugReportData[] = [];
  isLoading = true;
  errorMessage = '';
  filterStatus = 'all';
  searchQuery = '';

  // Detail modal
  selectedReport: BugReportData | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadBugReports();
  }

  async loadBugReports(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.bugReports = await this.supabaseService.getBugReports();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading bug reports:', error);
      this.errorMessage = this.t.t('adminBugs.loadError');
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.bugReports];

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.reported_by.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query)
      );
    }

    this.filteredReports = filtered;
  }

  async updateStatus(report: BugReportData, status: string): Promise<void> {
    try {
      await this.supabaseService.updateBugReportStatus(report.id, status);
      report.status = status as BugReportData['status'];
      this.applyFilters();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async deleteReport(report: BugReportData): Promise<void> {
    if (!confirm(this.t.t('adminBugs.deleteConfirm'))) return;

    try {
      await this.supabaseService.deleteBugReport(report.id);
      this.bugReports = this.bugReports.filter(r => r.id !== report.id);
      this.applyFilters();
      if (this.selectedReport?.id === report.id) {
        this.selectedReport = null;
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  }

  viewReport(report: BugReportData): void {
    this.selectedReport = report;
  }

  closeDetail(): void {
    this.selectedReport = null;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      ui: this.t.t('adminBugs.categoryUi'),
      functionality: this.t.t('adminBugs.categoryFunctionality'),
      performance: this.t.t('adminBugs.categoryPerformance'),
      submission: this.t.t('adminBugs.categorySubmission'),
      other: this.t.t('adminBugs.categoryOther')
    };
    return labels[category] || category;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: this.t.t('adminBugs.open'),
      in_progress: this.t.t('adminBugs.inProgress'),
      resolved: this.t.t('adminBugs.resolved'),
      closed: this.t.t('adminBugs.closed')
    };
    return labels[status] || status;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      ui: 'bg-purple-100 text-purple-700',
      functionality: 'bg-red-100 text-red-700',
      performance: 'bg-orange-100 text-orange-700',
      submission: 'bg-blue-100 text-blue-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  }

  get openCount(): number {
    return this.bugReports.filter(r => r.status === 'open').length;
  }

  get inProgressCount(): number {
    return this.bugReports.filter(r => r.status === 'in_progress').length;
  }

  get resolvedCount(): number {
    return this.bugReports.filter(r => r.status === 'resolved').length;
  }
}

