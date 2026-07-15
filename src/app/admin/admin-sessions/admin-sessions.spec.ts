import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSessions } from './admin-sessions';

describe('AdminSessions', () => {
  let component: AdminSessions;
  let fixture: ComponentFixture<AdminSessions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSessions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSessions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
