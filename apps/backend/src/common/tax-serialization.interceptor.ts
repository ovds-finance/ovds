import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TaxSerializationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(payload => this.transformStructure(payload)));
  }

  private transformStructure(node: any): any {
    if (node === null || node === undefined) return node;

    if (node.constructor?.name === 'Decimal' || typeof node === 'bigint') {
      return node.toString();
    }

    if (Array.isArray(node)) {
      return node.map(element => this.transformStructure(element));
    }

    if (typeof node === 'object') {
      const updatedNode: Record<string, any> = {};
      for (const attribute of Object.keys(node)) {
        updatedNode[attribute] = this.transformStructure(node[attribute]);
      }
      return updatedNode;
    }

    return node;
  }
}
