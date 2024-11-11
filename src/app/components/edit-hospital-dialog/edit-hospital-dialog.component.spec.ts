import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditHospitalDialogComponent } from './edit-hospital-dialog.component';

describe('EditHospitalDialogComponent', () => {
  let component: EditHospitalDialogComponent;
  let fixture: ComponentFixture<EditHospitalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditHospitalDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditHospitalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
