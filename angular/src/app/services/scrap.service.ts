import { Injectable } from '@angular/core';
import { last } from 'rxjs';

interface ScrapData {
  efectividad: string[];
  miembros: string[];
  policy_id: string[];
  subscriber_id: string[];
  terminacion: string[];
  ffm_id: string[];
  owner: string;
  email?: string; // Opcional
  phone?: string; // Opcional
  firstname: string;
  lastname: string;
  middlename: string;
  owner_ssn: string;
  owner_dob: string
}

@Injectable({
    providedIn: 'root',
})
export class Scrapshy {
    constructor() {}

    scrap(tabId): Promise<ScrapData | null> {
        return new Promise((resolve) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                        func: () => {
                            // Definimos ambas funciones en el mismo contexto
                            function getSpanTexts(texts: string[]) {
                                const textConditions = texts.map((text) => `text()="${text}"`).join(' or ');
                                const xpath = `//tr/td[span[${textConditions}]]/following-sibling::td/span`;

                                const result = document.evaluate(
                                    xpath,
                                    document,
                                    null,
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null,
                                );
                                const values: string[] = [];

                                for (let i = 0; i < result.snapshotLength; i++) {
                                    const span = result.snapshotItem(i) as HTMLElement;
                                    if (span) {
                                        values.push(span.textContent || '');
                                    }
                                }

                                return values;
                            }

                            function initial() {
                                const texts = ['Miembros', 'Members'];
                                const texts2 = ['Vigente', 'Effective'];
                                const texts3 = ['Vencimiento', 'Expiration'];
                                const texts4 = ['ID de subscritor', 'Subscriber ID'];
                                const texts5 = ['Nro. de identificación de la póliza', 'Policy ID'];
                                const texts6 = ['ID de FFM', 'FFM ID'];

                                const miembros = getSpanTexts(texts);
                                const efectividad = getSpanTexts(texts2);
                                const terminacion = getSpanTexts(texts3);
                                const subscriber_id = getSpanTexts(texts4);
                                const policy_id = getSpanTexts(texts5);
                                const ffm_id = getSpanTexts(texts6);
                                const owner_name = document.querySelector('.css-1ahwws6').textContent.trim()
                                const table_depends = document.querySelectorAll('.table-module__greyHeader___wgjY5 tbody tr')
                                const table_info = document.querySelectorAll('layouts-module__mb20___mUYnF tbody')                  

                                let data = {                                    
                                    miembros: miembros,
                                    efectividad: efectividad,
                                    terminacion: terminacion,
                                    subscriber_id: subscriber_id,
                                    policy_id: policy_id,
                                    ffm_id: ffm_id,
                                    owner: owner_name,         
                                    email: "example@example.com", // Añadir si es necesario
                                    phone: "123-456-7890",
                                    firstname: '',
                                    lastname: '',
                                    middlename: '',
                                    owner_ssn: '',
                                    owner_dob: ''
                                };

                                if (data) {
                                    const namesArray = data.miembros[0].split(',').map((name) => name.trim());
                                    const nombreCompleto = data.owner.split(' ');
                                    const cantidadnombres = nombreCompleto.length;
                                    data.firstname = nombreCompleto[0]
                                    
                                    if(cantidadnombres>0 && cantidadnombres<2 && nombreCompleto[1].length<2 || cantidadnombres>3){
                                        const secondname = nombreCompleto[1]
                                        data.middlename = secondname
                                        if(cantidadnombres>2){
                                            const apellido = (nombreCompleto[2]+' '+nombreCompleto[3])
                                            data.lastname = apellido
                                        }else{
                                            const apellido = nombreCompleto[2]
                                            data.lastname = apellido
                                        }
                                    }else if(cantidadnombres>0 && cantidadnombres<2){
                                        const apellido = nombreCompleto[1]
                                        data.lastname = apellido
                                    }else{
                                        const apellido = (nombreCompleto[1]+' '+nombreCompleto[2])
                                        data.lastname = apellido
                                    }

                                    table_depends.forEach((fila) => {
                                        const celdas = fila.querySelectorAll('td');
                                        
                                        // Verifica si hay celdas y si la primera celda contiene el nombre buscado
                                        if (celdas.length > 0 && celdas[0].textContent.trim() === data.owner) {
                                            // Supongamos que el SSN está en la segunda celda (índice 1)
                                            const ssn = celdas[4].textContent.trim();
                                            const dob = celdas[3].textContent.trim();
                                            data.owner_ssn = ssn
                                            data.owner_dob = dob
                                        }
                                    });
                                    
                                    data.owner = nombreCompleto[0]
                                    data.miembros = namesArray;
                                }
                                return data;
                            }

                            return initial(); // Llamamos a initial y devolvemos el resultado
                        },
                    },
                    (results) => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                            resolve(null); // Resuelve con null si hay un error
                        } else {
                            const spanText = results[0].result;
                            //console.log('Este es el resultado:' + JSON.stringify(spanText));
                            resolve(spanText); // Resuelve con el resultado                            
                        }
                    },
                )
            })
    }
}
