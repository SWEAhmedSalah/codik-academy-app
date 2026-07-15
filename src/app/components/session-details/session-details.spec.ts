import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetails } from './session-details';

describe('SessionDetails', () => {
  let component: SessionDetails;
  let fixture: ComponentFixture<SessionDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
