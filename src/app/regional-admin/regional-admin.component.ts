import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { RegionalAdminService } from './regional-admin.service';
import { Admin } from '../admin/admin.model';
import { Subscription } from 'rxjs';
import { Dustbin } from '../dustbins/dustbin.model';
import { LatLngLiteral } from '@agm/core';
import { MatDialog } from '@angular/material/dialog';
import { AddDustbinComponent } from './add-dustbin/add-dustbin.component';
import { AddDriverComponent } from './add-driver/add-driver.component';
import { Driver } from '../driver/driver.model';

@Component({
  selector: 'app-regional-admin',
  templateUrl: './regional-admin.component.html',
  styleUrls: ['./regional-admin.component.css']
})
export class RegionalAdminComponent implements OnInit , OnDestroy{


  private adminDetails: Admin;
  private adminDetailsSub: Subscription;
  private routeAssignedSub: Subscription;
  private dustbinSub: Subscription;
  private driverSub: Subscription;
  private dustbinsLocation: Dustbin[] = [];
  private dustbinLocationForRouteCalculation: Dustbin[] = [];
  private driverDetailsForChips: any[] = [];
  private dustbinsLocationForCollection: { location: LatLngLiteral, stopover: boolean }[] = [];
  origin: LatLngLiteral = { lat: 0, lng: 0 };
  destination: LatLngLiteral = { lat: 0, lng: 0 };
  private driversByRegion: Driver[] = [];
  private driversForRouteAssigned: Driver[] = [];
  private isAssignindLoading: boolean = false;
  private atLeastOneDriverAssigned: boolean = false;

  constructor(private regionalAdminService: RegionalAdminService, private authService: AuthService, private dialog: MatDialog) {}


  ngOnInit() {
    this.getRegionDetails(localStorage.getItem('regionCode'));
    this.getDustbinsForLocation(localStorage.getItem('regionCode')); 
    this.getDriverByRegion(localStorage.getItem('regionCode')); 
  }

  getRegionDetails(regionCode: string) {
    this.regionalAdminService.getRegionAdminDetails(regionCode);
    this.adminDetailsSub = this.regionalAdminService.getRegionalAdminDetailsListener()
      .subscribe((adminDetailsResponse) => {
        this.adminDetails = adminDetailsResponse;
      });
  }

  getDustbinsForLocation(region: string) {
    this.regionalAdminService.getAllDustbinsByRegion(region);
    this.dustbinSub = this.regionalAdminService.getAllDustbinsByRegionDataListener()
      .subscribe((dustbinData) => {
        this.dustbinsLocation = dustbinData;
      });
  }

  getDriverByRegion(regionCode: string) {
    this.regionalAdminService.getDriversByRegion(regionCode);
    this.driverSub = this.regionalAdminService.getAllDriversByRegionUpdated()
      .subscribe(driversData => {
        this.driversByRegion = driversData;
        var temp: {driverName: string, driverEmail: string, driverCapacity: number}[] = [];
        this.driversByRegion.forEach(element => {
          if (element.isRouteAssigned) {
            temp.push({ driverName: element.name, driverEmail: element.emailId, driverCapacity: element.capacity });
          }
        });
        this.driverDetailsForChips = temp;
        this.calculateRouteForDriver(temp);
      });
  }

  calculateRouteForDriver(driverDetailsForRouteCalculation: any) {
    this.regionalAdminService.getAllDustbinsByRegion(localStorage.getItem('regionCode'));
    this.regionalAdminService.getAllDustbinsByRegionDataListener()
      .subscribe(dustbinLocations => {
        this.dustbinLocationForRouteCalculation = dustbinLocations;
        console.log(driverDetailsForRouteCalculation);
      });
  }

  openAddDustbinForm() {
    this.dialog.open(AddDustbinComponent, {
      disableClose: true,
      width: '1000px',
      height: '600px'
    });
  }

  openAddDriverForm() {
    this.dialog.open(AddDriverComponent, {
      disableClose: true,
      width: '500px'
    });
  }

  onToggleRouteAssigned(email: string) {
    this.driverSub.unsubscribe();
    this.isAssignindLoading = true;
    this.regionalAdminService.toggleDriverRouteAssigned({emailId: email});
    this.routeAssignedSub = this.regionalAdminService.getRouteAssignedListener()
      .subscribe(data => {
        this.getDriverByRegion(localStorage.getItem('regionCode'));
        this.isAssignindLoading = false;        
      });
      window.location.reload();
  }


  ngOnDestroy() {
    this.adminDetailsSub.unsubscribe();
    if (this.atLeastOneDriverAssigned) {
      this.routeAssignedSub.unsubscribe();
    }
    this.dustbinSub.unsubscribe();
    this.driverSub.unsubscribe();
  }


}
