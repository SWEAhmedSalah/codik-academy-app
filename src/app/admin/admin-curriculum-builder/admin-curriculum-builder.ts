import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Course, CourseSection, Session, CurriculumNode } from '../../core/models/session.model';

@Component({
  selector: 'app-admin-curriculum-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-curriculum-builder.html'
})
export class AdminCurriculumBuilderComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  translate = inject(TranslationService);

  course: Course | null = null;
  curriculumTree: CurriculumNode[] = [];
  expandedSections = new Set<number>();
  searchQuery = '';
  isLoading = false;
  previewMode = false;
  errorMessage = '';
  successMessage = '';

  // Drag and drop
  draggedItem: CurriculumNode | null = null;
  dragOverItem: CurriculumNode | null = null;

  ngOnInit(): void {
    this.loadCurriculum();
  }

  async loadCurriculum(): Promise<void> {
    this.isLoading = true;
    try {
      const courseId = Number(this.route.snapshot.paramMap.get('courseId'));
      if (!courseId) {
        this.errorMessage = 'Course ID not found';
        this.router.navigate(['/admin']);
        return;
      }

      const data = await this.supabase.getCourseCurriculum(courseId);
      this.course = data.course;
      this.buildTree(data.sections, data.lessons);

      // Expand all sections by default
      this.expandAll();
    } catch (error) {
      console.error('Error loading curriculum:', error);
      this.errorMessage = 'Failed to load curriculum';
    } finally {
      this.isLoading = false;
    }
  }

  buildTree(sections: CourseSection[], lessons: Session[]): void {
    this.curriculumTree = sections.map((section: CourseSection) => {
      const sectionLessons = lessons.filter((lesson: Session) => lesson.section_id === section.id);
      const lessonNodes: CurriculumNode[] = sectionLessons.map((lesson: Session) => ({
        type: 'lesson',
        data: lesson,
        visible: true
      }));

      return {
        type: 'section',
        data: section,
        children: lessonNodes,
        expanded: this.expandedSections.has(section.id),
        visible: true
      };
    });

    // Apply search filter if exists
    if (this.searchQuery) {
      this.filterBySearch();
    }
  }

  toggleSection(sectionId: number): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }

    // Update tree
    this.curriculumTree = this.curriculumTree.map(node => {
      if (node.type === 'section') {
        const section = node.data as CourseSection;
        return { ...node, expanded: this.expandedSections.has(section.id) };
      }
      return node;
    });
  }

  expandAll(): void {
    this.curriculumTree.forEach(node => {
      if (node.type === 'section') {
        const section = node.data as CourseSection;
        this.expandedSections.add(section.id);
      }
    });
    this.curriculumTree = this.curriculumTree.map(node => ({
      ...node,
      expanded: true
    }));
  }

  collapseAll(): void {
    this.expandedSections.clear();
    this.curriculumTree = this.curriculumTree.map(node => ({
      ...node,
      expanded: false
    }));
  }

  filterBySearch(): void {
    const query = this.searchQuery.toLowerCase();

    if (!query) {
      // Show all
      this.curriculumTree = this.curriculumTree.map(node => ({
        ...node,
        visible: true,
        children: node.children?.map((child: CurriculumNode) => ({ ...child, visible: true }))
      }));
      return;
    }

    this.curriculumTree = this.curriculumTree.map((node: CurriculumNode) => {
      const section = node.data as CourseSection;
      const sectionMatch = section.title.toLowerCase().includes(query);

      let visibleChildren = 0;
      const updatedChildren = node.children?.map((child: CurriculumNode) => {
        const lesson = child.data as Session;
        const lessonMatch = lesson.title.toLowerCase().includes(query);
        const visible = sectionMatch || lessonMatch;
        if (visible) visibleChildren++;
        return { ...child, visible };
      });

      return {
        ...node,
        visible: sectionMatch || visibleChildren > 0,
        children: updatedChildren,
        expanded: visibleChildren > 0 ? true : node.expanded
      };
    });
  }

  // Drag and Drop
  onDragStart(event: DragEvent, node: CurriculumNode): void {
    this.draggedItem = node;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, node: CurriculumNode): void {
    event.preventDefault();
    this.dragOverItem = node;
    event.dataTransfer!.dropEffect = 'move';
  }

  onDragLeave(): void {
    this.dragOverItem = null;
  }

  async onDrop(event: DragEvent, targetNode: CurriculumNode): Promise<void> {
    event.preventDefault();
    this.dragOverItem = null;

    if (!this.draggedItem || this.draggedItem === targetNode) {
      this.draggedItem = null;
      return;
    }

    // Only allow section-to-section reordering for now
    if (this.draggedItem.type === 'section' && targetNode.type === 'section') {
      await this.reorderSections(this.draggedItem, targetNode);
    }

    this.draggedItem = null;
  }

  async reorderSections(draggedNode: CurriculumNode, targetNode: CurriculumNode): Promise<void> {
    const draggedSection = draggedNode.data as CourseSection;
    const targetSection = targetNode.data as CourseSection;

    try {
      const draggedOrder = draggedSection.order_index;
      const targetOrder = targetSection.order_index;

      await this.supabase.reorderCourseSection(draggedSection.id, targetOrder);
      await this.supabase.reorderCourseSection(targetSection.id, draggedOrder);

      this.successMessage = this.translate.t('success.sectionReordered');
      await this.loadCurriculum();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error reordering sections:', error);
      this.errorMessage = 'Failed to reorder sections';
    }
  }

  editSection(section: CourseSection): void {
    if (this.course) {
      this.router.navigate(['/admin/course-sections', this.course.id]);
    }
  }

  editLesson(lesson: Session): void {
    this.router.navigate(['/admin'], {
      queryParams: { tab: 'sessions', editSessionId: lesson.id }
    });
  }

  togglePreview(): void {
    this.previewMode = !this.previewMode;
  }

  navigateBack(): void {
    if (this.course) {
      this.router.navigate(['/admin/course-sections', this.course.id]);
    } else {
      this.router.navigate(['/admin']);
    }
  }

  getContentIcon(contentType?: string | null): string {
    switch (contentType) {
      case 'video': return '📹';
      case 'live': return '🎥';
      case 'article': return '📝';
      case 'quiz': return '✅';
      case 'assignment': return '📋';
      default: return '📄';
    }
  }

  // Helper methods for template type safety
  asSection(data: CourseSection | Session): CourseSection {
    return data as CourseSection;
  }

  asLesson(data: CourseSection | Session): Session {
    return data as Session;
  }

  getSectionId(node: CurriculumNode): number {
    return (node.data as CourseSection).id;
  }
}
