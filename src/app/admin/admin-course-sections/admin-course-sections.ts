import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Course, CourseSection } from '../../core/models/session.model';

@Component({
  selector: 'app-admin-course-sections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-course-sections.html'
})
export class AdminCourseSectionsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  translate = inject(TranslationService);

  course: Course | null = null;
  sections: CourseSection[] = [];
  sectionForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  editingSectionId: number | null = null;
  isDrawerOpen = false;
  errorMessage = '';
  successMessage = '';

  // Drag and drop
  draggedSection: CourseSection | null = null;
  dragOverIndex: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadCourseAndSections();
  }

  initForm(): void {
    this.sectionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      order_index: [1, [Validators.required, Validators.min(1)]]
    });
  }

  async loadCourseAndSections(): Promise<void> {
    this.isLoading = true;
    try {
      const courseId = Number(this.route.snapshot.paramMap.get('courseId'));
      if (!courseId) {
        this.errorMessage = 'Course ID not found';
        this.router.navigate(['/admin']);
        return;
      }

      // Load course
      this.course = await this.supabase.getCourseDetails(courseId);
      if (!this.course) {
        this.errorMessage = 'Course not found';
        this.router.navigate(['/admin']);
        return;
      }

      // Load sections
      await this.loadSections();
    } catch (error) {
      console.error('Error loading course and sections:', error);
      this.errorMessage = 'Failed to load course sections';
    } finally {
      this.isLoading = false;
    }
  }

  async loadSections(): Promise<void> {
    if (!this.course) return;

    try {
      this.sections = await this.supabase.getCourseSections(this.course.id);
    } catch (error) {
      console.error('Error loading sections:', error);
      this.errorMessage = 'Failed to load sections';
    }
  }

  openDrawer(section?: CourseSection): void {
    if (section) {
      this.isEditMode = true;
      this.editingSectionId = section.id;
      this.sectionForm.patchValue({
        title: section.title,
        description: section.description || '',
        order_index: section.order_index
      });
    } else {
      this.isEditMode = false;
      this.editingSectionId = null;
      const nextOrder = this.sections.length > 0
        ? Math.max(...this.sections.map((section: CourseSection) => section.order_index)) + 1
        : 1;
      this.sectionForm.patchValue({
        title: '',
        description: '',
        order_index: nextOrder
      });
    }
    this.isDrawerOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.sectionForm.reset();
    this.isEditMode = false;
    this.editingSectionId = null;
  }

  async submitForm(): Promise<void> {
    if (this.sectionForm.invalid || !this.course) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = this.sectionForm.value;

      if (this.isEditMode && this.editingSectionId) {
        await this.supabase.updateCourseSection(this.editingSectionId, formData);
        this.successMessage = this.translate.t('success.sectionUpdated');
      } else {
        await this.supabase.createCourseSection({
          course_id: this.course.id,
          ...formData
        });
        this.successMessage = this.translate.t('success.sectionCreated');
      }

      await this.loadSections();
      this.closeDrawer();

      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error saving section:', error);
      this.errorMessage = 'Failed to save section';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteSection(section: CourseSection): Promise<void> {
    if (!confirm(this.translate.t('admin.deleteSectionConfirm'))) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supabase.deleteCourseSection(section.id);
      this.successMessage = this.translate.t('success.sectionDeleted');
      await this.loadSections();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error deleting section:', error);
      this.errorMessage = 'Failed to delete section';
    } finally {
      this.isLoading = false;
    }
  }

  // Drag and Drop Handlers
  onDragStart(event: DragEvent, section: CourseSection): void {
    this.draggedSection = section;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
    event.dataTransfer!.dropEffect = 'move';
  }

  onDragLeave(): void {
    this.dragOverIndex = null;
  }

  async onDrop(event: DragEvent, targetSection: CourseSection): Promise<void> {
    event.preventDefault();
    this.dragOverIndex = null;

    if (!this.draggedSection || this.draggedSection.id === targetSection.id) {
      this.draggedSection = null;
      return;
    }

    try {
      const draggedIndex = this.draggedSection.order_index;
      const targetIndex = targetSection.order_index;

      // Swap order indexes
      await this.supabase.reorderCourseSection(this.draggedSection.id, targetIndex);
      await this.supabase.reorderCourseSection(targetSection.id, draggedIndex);

      this.successMessage = this.translate.t('success.sectionReordered');
      await this.loadSections();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error reordering sections:', error);
      this.errorMessage = 'Failed to reorder sections';
    } finally {
      this.draggedSection = null;
    }
  }

  navigateToCurriculumBuilder(): void {
    if (this.course) {
      this.router.navigate(['/admin/curriculum-builder', this.course.id]);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/admin']);
  }
}
