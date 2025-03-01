import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearPublicacionPage } from './crear-publicacion.page';

describe('CrearPublicacionPage', () => {
  let component: CrearPublicacionPage;
  let fixture: ComponentFixture<CrearPublicacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearPublicacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
