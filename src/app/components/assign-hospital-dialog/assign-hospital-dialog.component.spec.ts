import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignHospitalDialogComponent } from './assign-hospital-dialog.component';

describe('AssignHospitalDialogComponent', () => {
  let component: AssignHospitalDialogComponent;
  let fixture: ComponentFixture<AssignHospitalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignHospitalDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignHospitalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
