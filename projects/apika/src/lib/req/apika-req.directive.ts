import {Directive, inject, Input, OnChanges, TemplateRef, ViewContainerRef} from '@angular/core';
import {ApikaReqHandlerStatus} from '../apika';
import {ApikaReqFailedComponent} from './apika-req-failed.component';
import {ApikaReqOngoingComponent} from './apika-req-ongoing.component';
import {ApikaReqFailed, ApikaReqOngoing} from './apika-req-tokens';

@Directive({
  selector: '[req]',
  standalone: true,
})
export class ApikaReqDirective implements OnChanges {
  viewContainer = inject(ViewContainerRef);
  templateRef = inject(TemplateRef<any>);

  customOngoingComponent = inject(ApikaReqOngoing, {optional: true});
  customFailedComponent = inject(ApikaReqFailed, {optional: true});

  @Input() req!: ApikaReqHandlerStatus;

  ngOnChanges() {
    this.viewContainer.clear();
    switch (this.req) {
      case 'Succeed':
        this.viewContainer.createEmbeddedView(this.templateRef);
        break;
      case 'Ongoing':
        this.viewContainer.createComponent(this.customOngoingComponent ?? ApikaReqOngoingComponent);
        break;
      case 'Failed':
        this.viewContainer.createComponent(this.customFailedComponent ?? ApikaReqFailedComponent);
        break;
      default:
    }
  }
}
