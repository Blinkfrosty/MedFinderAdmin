import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDoctorDialogComponent } from './edit-doctor-dialog.component';

describe('EditDoctorDialogComponent', () => {
  let component: EditDoctorDialogComponent;
  let fixture: ComponentFixture<EditDoctorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDoctorDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditDoctorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
