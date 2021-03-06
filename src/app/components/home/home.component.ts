import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {CellClickEvent} from '../../tables/table-widget/table-widget.component';
import {RowDialogComponent} from '../../tables/row-dialog/row-dialog.component';
import {DatabaseService} from '../../providers/database.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Utils} from '../../commons/Utils';
import {LoggerService} from '../../providers/logger.service';
import {TranslateService} from '@ngx-translate/core';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  logTag = HomeComponent.name;

  @ViewChild('table1', { static: true }) table1;
  @ViewChild('table2', { static: true }) table2;
  @ViewChild('table3', { static: true }) table3;
  @ViewChild('table4', { static: true }) table4;
  @ViewChild('table5', { static: true }) table5;

  constructor(
    private databaseService: DatabaseService,
    private zone: NgZone,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private logger: LoggerService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit() {}


  cellClicked(tableId: number, event: CellClickEvent) {
    const el = event.element;
    const colName = event.columnName;

    if (event.columnName === 'verified') {
      const value = el[colName] === 0 ? 1 : 0;
      this.databaseService.updateRow(el.table_id, el.table_ref, {verified: value}).subscribe((result) => {
        console.log(result);
        this.reloadTable(tableId);
      });
    } else if (colName === 'delete_row') {
      this.zone.run(() => {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {data: {title: 'PAGES.CONFIRM_DIALOG.SURE'}});
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.deleteRow(tableId, el);
          }
        });
      });
    } else {
      this.openRowDialog(tableId, event.element);
    }
  }

  openRowDialog(tableId: number, element?: any) {
    let dialogRef;

    // component' onInit not fired without Zone
    this.zone.run(() => {
      dialogRef = this.dialog.open(RowDialogComponent, {
        data: { tableId: tableId, element: element },
        width: '40%', height: '90%'
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('Dialog closed', result);
        if (result && result !== 'canceled' && result.changes > 0) {
          this.reloadTable(tableId);
        }
      });
    });
  }

  deleteRow(tableId: number, el: any) {
    this.logger.debug(this.logTag, 'deleting', el);
    let snackbarText, snackbarDuration, snackbarActionText, snackbarActionCallback, snackbarRef;

    this.databaseService.deleteRow(el.table_id, el.slot_number).subscribe((result) => {
      console.log(result);
      console.log(result.date, typeof result.date);
        this.logger.debug(this.logTag, 'Delete result', result);
        snackbarText = this.translateService.instant('SUCCESSES.DELETE');
        snackbarDuration = 5000;
        snackbarActionText = this.translateService.instant('COMMONS.CANCEL');
        snackbarActionCallback = () => {
          this.logger.info(this.logTag, 'Delete undo requested');
          result['slot_number'] = el.slot_number;
          console.log(result);
          this.databaseService.insertRow(tableId, result).subscribe((result2) => {
            this.logger.info(this.logTag, 'Delete undo success');
            this.reloadTable(tableId);
          }, (error2) => {
            this.logger.error(this.logTag, 'Delete undo error!', error2);
          });

          snackbarRef.dismiss();

        };

        this.zone.run(() => {
          snackbarRef = Utils.openSnackbar(
            this.snackBar, snackbarText, snackbarDuration, snackbarActionText, snackbarActionCallback);

        });
        this.reloadTable(tableId);
      },
      (errors) => {
        this.logger.error(this.logTag, 'Delete error!', errors);
        snackbarText = this.translateService.instant('ERRORS.GENERIC');
        snackbarDuration = 3000;
        Utils.openSnackbar(
          this.snackBar, snackbarText, snackbarDuration);
      });
  }

  reloadTable(tableId: number) {
    switch (tableId) {
      case 1: this.table1.reload(); break;
      case 2: this.table2.reload(); break;
      case 3: this.table3.reload(); break;
      case 4: this.table4.reload(); break;
      case 5: this.table5.reload(); break;
    }
  }
}
