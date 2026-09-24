import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { StudentStateService } from '../../core/services/student-state';
import { Course, CourseSection, Session, UserCourseProgress } from '../../core/models/session.model';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-details.html'
})
export class CourseDetails implements OnInit {
  readonly supabase = inject(SupabaseService);
  readonly t = inject(TranslationService);
  readonly stateService = inject(StudentStateService);

  course = signal<Course | null>(null);
  sections = signal<CourseSection[]>([]);
  lessons = signal<Session[]>([]);
  isEnrolled = signal(false);
  userProgress = signal<UserCourseProgress>({ completedLessons: 0, totalLessons: 0, percentage: 0 });
  loading = signal(true);
  enrolling = signal(false);

  expandedSections = new Set<number>();
  searchQuery = signal('');
  filteredSections = signal<CourseSection[]>([]);

  async ngOnInit() {
    const courseId = this.stateService.selectedCourseId();
    if (courseId) {
      await this.loadCourseDetails(courseId);
    }
  }

  async loadCourseDetails(courseId: number) {
    try {
      this.loading.set(true);

      // Load course details
      const course = await this.supabase.getCourseDetails(courseId);
      this.course.set(course);
      console.log('📚 Loaded course:', course?.title, 'Status:', course?.status);

      // Load sections with lessons
      const sections = await this.supabase.getCourseSections(courseId);
      const lessons = await this.supabase.getCourseLessons(courseId);

      console.log('📂 Loaded sections:', sections.length, 'sections');
      console.log('📝 Loaded lessons:', lessons.length, 'lessons');

      if (sections.length === 0) {
        console.warn('⚠️ No sections found! This could be due to:');
        console.warn('1. No sections created yet for this course');
        console.warn('2. Course status is Draft (check RLS policies)');
        console.warn('3. Database permissions issue');
        console.warn('Course ID:', courseId, 'Course Status:', course?.status);
      }

      // Group lessons by section
      const sectionsWithLessons = sections.map(section => ({
        ...section,
        lessons: lessons.filter(lesson => lesson.section_id === section.id)
      }));

      // Log sections with lesson counts
      sectionsWithLessons.forEach(section => {
        console.log(`  📁 ${section.title}: ${section.lessons?.length || 0} lessons`);
      });

      this.sections.set(sectionsWithLessons);
      this.lessons.set(lessons);
      this.filteredSections.set(sectionsWithLessons);

      // Check enrollment and progress
      const user = await this.supabase.getCurrentUser();
      if (user) {
        const enrolled = await this.supabase.isUserEnrolled(user.id, courseId);
        this.isEnrolled.set(enrolled);
        console.log('👤 User enrolled:', enrolled);

        if (enrolled) {
          const progress = await this.supabase.getUserCourseProgress(user.id, courseId);
          this.userProgress.set(progress);
        }
      }
    } catch (error) {
      console.error('❌ Error loading course details:', error);
      console.error('Error details:', {
        courseId,
        error: error instanceof Error ? error.message : error
      });
    } finally {
      this.loading.set(false);
    }
  }

  toggleSection(sectionId: number) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  isSectionExpanded(sectionId: number): boolean {
    return this.expandedSections.has(sectionId);
  }

  expandAll() {
    this.sections().forEach(section => {
      this.expandedSections.add(section.id);
    });
  }

  collapseAll() {
    this.expandedSections.clear();
  }

  onSearchLessons(query: string) {
    this.searchQuery.set(query);
    if (query.trim()) {
      const filtered = this.sections().map(section => ({
        ...section,
        lessons: section.lessons?.filter(lesson =>
          lesson.title.toLowerCase().includes(query.toLowerCase()) ||
          lesson.description?.toLowerCase().includes(query.toLowerCase())
        ) || []
      })).filter(section => (section.lessons?.length || 0) > 0);
      this.filteredSections.set(filtered);
    } else {
      this.filteredSections.set(this.sections());
    }
  }

  scrollToCurriculum() {
    const element = document.getElementById('curriculum-section');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async enrollInCourse() {
    const course = this.course();
    if (!course) return;

    try {
      this.enrolling.set(true);
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        alert(this.t.t('error.sessionExpired'));
        return;
      }

      await this.supabase.enrollUserInCourse(user.id, course.id);
      this.isEnrolled.set(true);

      // Show success message
      alert(this.t.t('courses.enrollmentSuccess'));
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert(this.t.t('courses.enrollmentError'));
    } finally {
      this.enrolling.set(false);
    }
  }

  startLearning() {
    const course = this.course();
    if (!course) return;

    // Navigate to first lesson or course learning interface
    const firstLesson = this.lessons()[0];
    if (firstLesson) {
      this.stateService.openSession(firstLesson);
    }
  }

  goBack() {
    this.stateService.openCourses();
  }

  getRelativeTime(dateString?: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return this.t.t('courses.updatedToday');
    if (diffInDays === 1) return this.t.t('courses.updatedYesterday');
    return `${diffInDays} ${this.t.t('dashboard.days')}`;
  }
}

