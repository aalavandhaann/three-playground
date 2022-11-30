import { Vector2 } from "three";


export class CanvasProjection{
    constructor(domParentID){
        this.__canvasWidth = 350;
        this.__canvasHeight = this.__canvasWidth * (9/16);
        this.__canvasOrigin = new Vector2(this.__canvasWidth * 0.5, this.__canvasHeight * 0.5);
        this.__points = [];
        this.__domParent = document.getElementById(domParentID);
        this.__domElement = this.__createDomElement(domParentID);
        this.__canvasContext = this.__createCanvasContext(this.__domElement);
        this.__refreshCanvas();
    }

    __createDomElement(domParentID){
        let domParent = document.getElementById(domParentID);
        let domElement = document.createElement('DIV');
        domElement.setAttribute('id', `${domParentID}-canvas`);
        domParent.append(domElement);
        domElement.style.position = 'absolute';
        domElement.style.right = 0;
        domElement.style.bottom = 0;
        return domElement;
    }

    __createCanvasContext(domElement){
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.__canvasWidth;
        ctx.canvas.height = this.__canvasHeight;
        domElement.append(ctx.canvas);
        return ctx;
    }

    __refreshCanvas(){
        this.__canvasContext.clearRect(0, 0, this.__canvasContext.canvas.width, this.__canvasContext.canvas.height);
        this.__canvasContext.fillStyle = '#FFFFFF';
        this.__canvasContext.fillRect(0, 0, this.__canvasContext.canvas.width, this.__canvasContext.canvas.height);
    }

    __drawPoints(){
        let pointRadius = 5;
        this.__canvasContext.fillStyle = '#000000';
        this.__points.forEach((point) => {
            this.__canvasContext.beginPath();
            this.__canvasContext.arc(point.x + this.__canvasOrigin.x, point.y + this.__canvasOrigin.y, pointRadius, 0, Math.PI * 2);
            this.__canvasContext.closePath();
            this.__canvasContext.fill();
        });
    }

    render(time){
        this.__refreshCanvas();  
        this.__drawPoints();
    }

    get points(){
        return this.__points;
    }

    set points(points){
        this.__points = points.slice(0);
    }
}