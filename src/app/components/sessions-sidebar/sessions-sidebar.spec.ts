import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionsSidebar } from './sessions-sidebar';

describe('SessionsSidebar', () => {
  let component: SessionsSidebar;
  let fixture: ComponentFixture<SessionsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionsSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
