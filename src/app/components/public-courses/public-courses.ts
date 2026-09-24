import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase';
import { TranslationService } from '../../core/services/translation.service';
import { StudentStateService } from '../../core/services/student-state';
import { Course, CourseWithProgress, CourseFilters } from '../../core/models/session.model';

@Component({
  selector: 'app-public-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-courses.html'
})
export class PublicCourses implements OnInit {
  readonly supabase = inject(SupabaseService);
  readonly t = inject(TranslationService);
  readonly stateService = inject(StudentStateService);

  courses = signal<CourseWithProgress[]>([]);
  filteredCourses = signal<CourseWithProgress[]>([]);
  loading = signal(true);

  searchQuery = signal('');
  categoryFilter = signal('all');
  difficultyFilter = signal('all');
  priceFilter = signal('all');
  typeFilter = signal('all');
  sortBy = signal<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');

  // Categories and filters (can be dynamic from database)
  categories = [
    'Programming',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Design',
    'Business'
  ];

  difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  courseTypes = ['Live', 'Recorded', 'Article'];

  async ngOnInit() {
    await this.loadCourses();
  }

  async loadCourses() {
    try {
      this.loading.set(true);
      const user = await this.supabase.getCurrentUser();

      if (user) {
        // Get enrolled courses with progress
        const enrolledCourses = await this.supabase.getEnrolledCoursesWithProgress(user.id);

        // Get all public courses
        const allCourses = await this.supabase.getPublicCourses();

        // Merge enrolled courses with all courses
        const coursesMap = new Map<number, CourseWithProgress>();

        // Add enrolled courses first
        enrolledCourses.forEach(course => {
          coursesMap.set(course.id, course);
        });

        // Add non-enrolled courses
        allCourses.forEach(course => {
          if (!coursesMap.has(course.id)) {
            coursesMap.set(course.id, { ...course });
          }
        });

        this.courses.set(Array.from(coursesMap.values()));
      } else {
        // Not logged in - show all public courses
        const allCourses = await this.supabase.getPublicCourses();
        this.courses.set(allCourses);
      }

      this.applyFilters();
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = [...this.courses()];

    // Search filter
    const search = this.searchQuery().toLowerCase();
    if (search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(search) ||
        course.description?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(course => course.category === this.categoryFilter());
    }

    // Difficulty filter
    if (this.difficultyFilter() !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === this.difficultyFilter());
    }

    // Price filter
    if (this.priceFilter() === 'free') {
      filtered = filtered.filter(course => course.is_free);
    } else if (this.priceFilter() === 'paid') {
      filtered = filtered.filter(course => !course.is_free);
    }

    // Type filter
    if (this.typeFilter() !== 'all') {
      filtered = filtered.filter(course => course.course_type === this.typeFilter());
    }

    // Sort
    switch (this.sortBy()) {
      case 'newest':
        filtered.sort((a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        break;
      case 'popular':
        filtered.sort((a, b) => (b.total_students || 0) - (a.total_students || 0));
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    this.filteredCourses.set(filtered);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  onCategoryChange(category: string) {
    this.categoryFilter.set(category);
    this.applyFilters();
  }

  onDifficultyChange(difficulty: string) {
    this.difficultyFilter.set(difficulty);
    this.applyFilters();
  }

  onPriceChange(price: string) {
    this.priceFilter.set(price);
    this.applyFilters();
  }

  onTypeChange(type: string) {
    this.typeFilter.set(type);
    this.applyFilters();
  }

  onSortChange(sort: 'newest' | 'popular' | 'price_asc' | 'price_desc') {
    this.sortBy.set(sort);
    this.applyFilters();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.categoryFilter.set('all');
    this.difficultyFilter.set('all');
    this.priceFilter.set('all');
    this.typeFilter.set('all');
    this.sortBy.set('newest');
    this.applyFilters();
  }

  navigateToCourse(courseId: number) {
    this.stateService.openCourse(courseId);
  }

  getActionButtonText(course: CourseWithProgress): string {
    if (course.progress) {
      if (course.progress.percentage > 0) {
        return this.t.t('courses.continueLearning');
      }
      return this.t.t('courses.startLearning');
    }
    return course.is_free ? this.t.t('courses.enrollFree') : this.t.t('courses.enrollNow');
  }

  getActionButtonClass(course: CourseWithProgress): string {
    if (course.progress) {
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
    return course.is_free
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-purple-600 hover:bg-purple-700 text-white';
  }

  getBadgeText(course: Course): string {
    if (course.is_free) return this.t.t('courses.free');
    return this.t.t('courses.paid');
  }

  getBadgeClass(course: Course): string {
    if (course.is_free) return 'bg-emerald-500';
    return 'bg-purple-500';
  }

  getTypeBadgeText(type?: string): string {
    switch (type) {
      case 'Live':
        return this.t.t('courses.live');
      case 'Recorded':
        return this.t.t('courses.recorded');
      case 'Article':
        return this.t.t('courses.article');
      default:
        return type || '';
    }
  }
}

