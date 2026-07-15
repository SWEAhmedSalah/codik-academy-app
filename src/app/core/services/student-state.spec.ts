import { TestBed } from '@angular/core/testing';

import { StudentState } from './student-state';

describe('StudentState', () => {
  let service: StudentState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
