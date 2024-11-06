import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageHospitalsComponent } from './manage-hospitals.component';

describe('ManageHospitalsComponent', () => {
  let component: ManageHospitalsComponent;
  let fixture: ComponentFixture<ManageHospitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageHospitalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageHospitalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
