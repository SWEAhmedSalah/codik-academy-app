import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { Course } from '../../core/models/session.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-courses.html'
})
export class AdminCourses implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly t = inject(TranslationService);

  courses: Course[] = [];
  courseForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  isEditMode = false;
  editingCourseId: number | null = null;
  isDrawerOpen = false;
  activeMenuCourseId: number | null = null;

  // Dropdown options
  readonly categories = [
    'البرمجة',
    'تصميم',
    'تطوير الويب',
    'تطوير التطبيقات',
    'علوم البيانات',
    'الأمن السيبراني',
    'الذكاء الاصطناعي',
    'DevOps',
    'أخرى'
  ];

  readonly difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];
  readonly courseTypes = ['Live', 'Recorded', 'Article'];
  readonly statusOptions = ['Draft', 'Published'];

  ngOnInit(): void {
    this.initForm();
    this.loadCourses();
  }

  initForm(): void {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      slug: [''],
      description: [''],
      thumbnail_url: [''],
      category: ['', Validators.required],
      difficulty_level: ['Beginner', Validators.required],
      course_type: ['Recorded', Validators.required],
      price: [0, [Validators.min(0)]],
      is_free: [true],
      instructor_name: [''],
      status: ['Draft', Validators.required],
      rating: [0, [Validators.min(0), Validators.max(5)]],
      course_duration_hours: [0, [Validators.min(0)]],
      learning_objectives: this.fb.array([])
    });

    // Auto-toggle is_free based on price
    this.courseForm.get('price')?.valueChanges.subscribe((price: number | null) => {
      const isFree = !price || price === 0;
      this.courseForm.get('is_free')?.setValue(isFree, { emitEvent: false });
    });

    this.courseForm.get('is_free')?.valueChanges.subscribe((isFree: boolean | null) => {
      if (isFree) {
        this.courseForm.get('price')?.setValue(0, { emitEvent: false });
      }
    });
  }

  get learningObjectives(): FormArray {
    return this.courseForm.get('learning_objectives') as FormArray;
  }

  addObjective(): void {
    if (this.learningObjectives.length < 10) {
      this.learningObjectives.push(this.fb.control('', [Validators.required, Validators.maxLength(150)]));
    }
  }

  removeObjective(index: number): void {
    this.learningObjectives.removeAt(index);
  }

  moveObjectiveUp(index: number): void {
    if (index > 0) {
      const current = this.learningObjectives.at(index).value;
      const previous = this.learningObjectives.at(index - 1).value;
      this.learningObjectives.at(index).setValue(previous);
      this.learningObjectives.at(index - 1).setValue(current);
    }
  }

  moveObjectiveDown(index: number): void {
    if (index < this.learningObjectives.length - 1) {
      const current = this.learningObjectives.at(index).value;
      const next = this.learningObjectives.at(index + 1).value;
      this.learningObjectives.at(index).setValue(next);
      this.learningObjectives.at(index + 1).setValue(current);
    }
  }

  generateSlug(): void {
    const title = this.courseForm.get('title')?.value || '';
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-أ-ي]+/g, '')
      .replace(/\-\-+/g, '-');
    this.courseForm.get('slug')?.setValue(slug);
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  openAddMode(): void {
    this.isEditMode = false;
    this.editingCourseId = null;
    this.clearMessages();

    this.courseForm.reset({
      difficulty_level: 'Beginner',
      course_type: 'Recorded',
      status: 'Draft',
      is_free: true,
      price: 0,
      rating: 0,
      course_duration_hours: 0
    });

    this.learningObjectives.clear();
    this.addObjective();
    this.addObjective();
    this.addObjective();

    this.openDrawer();
  }

  editCourse(course: Course): void {
    this.isEditMode = true;
    this.editingCourseId = course.id;
    this.clearMessages();

    this.courseForm.patchValue({
      title: course.title,
      slug: course.slug || '',
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      category: course.category || '',
      difficulty_level: course.difficulty_level || 'Beginner',
      course_type: course.course_type || 'Recorded',
      price: course.price || 0,
      is_free: course.is_free,
      instructor_name: course.instructor_name || '',
      status: course.status,
      rating: course.rating || 0,
      course_duration_hours: course.course_duration_hours || 0
    });

    this.learningObjectives.clear();
    if (course.learning_objectives && course.learning_objectives.length > 0) {
      course.learning_objectives.forEach((obj: string) => {
        this.learningObjectives.push(this.fb.control(obj, [Validators.required, Validators.maxLength(150)]));
      });
    } else {
      this.addObjective();
      this.addObjective();
      this.addObjective();
    }

    this.openDrawer();
  }

  async deleteCourse(id: number): Promise<void> {
    if (!confirm(this.t.t('admin.deleteCourseConfirm'))) {
      return;
    }

    try {
      this.isLoading = true;
      this.clearMessages();

      await this.supabaseService.deleteCourse(id);
      this.successMessage = this.t.t('success.courseDeleted');

      if (this.isEditMode && this.editingCourseId === id) {
        this.openAddMode();
      }

      await this.loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      const formValues = this.courseForm.value;

      const courseData = {
        title: formValues.title?.trim(),
        slug: formValues.slug?.trim() || null,
        description: formValues.description?.trim() || null,
        thumbnail_url: formValues.thumbnail_url?.trim() || null,
        category: formValues.category,
        difficulty_level: formValues.difficulty_level,
        course_type: formValues.course_type,
        price: formValues.is_free ? 0 : Number(formValues.price),
        is_free: formValues.is_free,
        instructor_name: formValues.instructor_name?.trim() || null,
        status: formValues.status,
        rating: Number(formValues.rating) || 0,
        course_duration_hours: Number(formValues.course_duration_hours) || 0,
        learning_objectives: this.learningObjectives.value.filter((obj: string) => obj.trim() !== '')
      };

      if (this.isEditMode && this.editingCourseId) {
        await this.supabaseService.updateCourse(this.editingCourseId, courseData);
        this.successMessage = this.t.t('success.courseUpdated');
      } else {
        await this.supabaseService.createCourse(courseData);
        this.successMessage = this.t.t('success.courseCreated');
      }

      this.closeDrawer();
      await this.loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  async loadCourses(): Promise<void> {
    try {
      this.isLoading = true;
      this.courses = await this.supabaseService.getAllCourses();
    } catch (error) {
      console.error('Error loading courses:', error);
      this.errorMessage = this.t.t('error.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getPriceBadgeClass(isFree?: boolean | null): string {
    return isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';
  }

  // ========== NEW FEATURES ==========

  /**
   * Toggle action menu for a course
   */
  toggleActionMenu(courseId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.activeMenuCourseId = this.activeMenuCourseId === courseId ? null : courseId;
  }

  /**
   * Navigate to manage sections page
   */
  manageSections(course: Course, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.activeMenuCourseId = null;
    this.router.navigate(['/admin/course-sections', course.id]);
  }

  /**
   * Duplicate a course with all sections and lessons
   */
  async duplicateCourse(course: Course, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm(this.t.get('admin.duplicateCourseConfirm') || 'Duplicate this course?')) {
      return;
    }

    this.activeMenuCourseId = null;
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.supabaseService.duplicateCourse(course.id);
      this.successMessage = this.t.get('success.courseDuplicated') || 'Course duplicated successfully!';
      await this.loadCourses();

      // Auto-scroll to the new course (it will be at the top since we sort by created_at desc)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error duplicating course:', error);
      this.errorMessage = this.t.get('error.duplicateFailed') || 'Failed to duplicate course';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Quick toggle course status (Published <-> Draft)
   */
  async quickToggleStatus(course: Course, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    this.activeMenuCourseId = null;
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.supabaseService.quickToggleCourseStatus(course.id);
      const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
      this.successMessage = `${this.t.get('success.statusToggled') || 'Status changed to'} ${newStatus}`;
      await this.loadCourses();
    } catch (error) {
      console.error('Error toggling status:', error);
      this.errorMessage = this.t.get('error.statusToggleFailed') || 'Failed to toggle status';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get section count for a course
   */
  getSectionCount(course: Course): number {
    return course.total_sections || 0;
  }

  /**
   * Get lesson count for a course
   */
  getLessonCount(course: Course): number {
    return course.total_lessons || 0;
  }
}
