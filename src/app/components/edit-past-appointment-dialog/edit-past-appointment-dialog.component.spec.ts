import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPastAppointmentDialogComponent } from './edit-past-appointment-dialog.component';

describe('EditPastAppointmentDialogComponent', () => {
  let component: EditPastAppointmentDialogComponent;
  let fixture: ComponentFixture<EditPastAppointmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPastAppointmentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPastAppointmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
