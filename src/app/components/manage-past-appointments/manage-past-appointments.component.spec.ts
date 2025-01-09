import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePastAppointmentsComponent } from './manage-past-appointments.component';

describe('ManagePastAppointmentsComponent', () => {
  let component: ManagePastAppointmentsComponent;
  let fixture: ComponentFixture<ManagePastAppointmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePastAppointmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePastAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
