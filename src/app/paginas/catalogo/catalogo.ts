import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';


interface HealthService {

  id:number;
  name:string;
  description:string;
  durationMinutes:number;
  price:number;
  active:boolean;

}


interface ClinicalBox {

  id:number;
  name:string;
  centerName:string;
  active:boolean;

}


interface Slot {

  id:number;
  boxId:number;
  serviceId:number;
  startTime:string;
  available:boolean;

}



@Component({

  imports:[
    CommonModule
  ],

  selector:'app-catalogo',

  styleUrl:'./catalogo.css',

  templateUrl:'./catalogo.html',

})


export class Catalogo implements OnInit {


private http = inject(HttpClient);



services = signal<HealthService[]>([]);

boxes = signal<ClinicalBox[]>([]);

slots = signal<Slot[]>([]);


errorMessage = signal('');



ngOnInit():void {


this.loadCatalog();



}



private loadCatalog():void {



this.http
.get<HealthService[]>(
'http://localhost:8080/api/bff/catalog/services'
)
.subscribe({

next:(data)=>{

console.log(
'Servicios:',
data
);

this.services.set(data);

},


error:(error)=>{

console.error(
'Error servicios',
error
);

this.errorMessage.set(
'Error cargando servicios'
);

}

});




this.http
.get<ClinicalBox[]>(
'http://localhost:8080/api/bff/catalog/boxes'
)
.subscribe({

next:(data)=>{

console.log(
'Boxes:',
data
);

this.boxes.set(data);

}


});





this.http
.get<Slot[]>(
'http://localhost:8080/api/bff/catalog/slots'
)
.subscribe({

next:(data)=>{

console.log(
'Slots:',
data
);

this.slots.set(data);

}


});



}


}