import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAdminAccountComponent } from './update-admin-account.component';

describe('UpdateAdminAccountComponent', () => {
  let component: UpdateAdminAccountComponent;
  let fixture: ComponentFixture<UpdateAdminAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateAdminAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAdminAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
