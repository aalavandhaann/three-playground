import { GUI } from "dat.gui";
import { ArrowHelper, BoxGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3 } from "three";
import { ThreeScene } from "../common/ThreeScene";
import { CanvasProjection } from "./CanvasProjection";

const UP_DIRECTION = new Vector3(0, 1, 0);

export class PlaneProjection extends ThreeScene{

    constructor(elementID){
        super(elementID);
        this.__maxBoxWidth = 100;
        this.__maxBoxHeight = 100;
        this.__maxBoxDepth = 100;
        this.__lightNormal = null;
        this.__meshUpdatedEvent = this.__meshUpdated.bind(this);
        this.__canvasProjection = new CanvasProjection(this.__domID);
        this.__addLightArrows();
        this.__addBox();
        this.__addGUI();
        this.__meshUpdated();
    }

    __addGUI(){
        let gui = new GUI({name: 'Plane Projector'});
        let meshSizeFolder = gui.addFolder('Mesh Size')
        let meshRotationFolder = gui.addFolder('Mesh Orientation');
        let lightConfiguration = gui.addFolder('Light Configuration')

        meshSizeFolder.add(this.__box.scale, 'x', 0.1, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent);
        meshSizeFolder.add(this.__box.scale, 'y', 0.1, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent);
        meshSizeFolder.add(this.__box.scale, 'z', 0.1, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent);
                
        meshRotationFolder.add(this.__box.rotation, 'y', 0.0, Math.PI * 2.0, 0.1).onChange(this.__meshUpdatedEvent);

        lightConfiguration.add(this.__directionalLight.position, 'x', -this.__maxBoxWidth, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent).name('Position X');
        lightConfiguration.add(this.__directionalLight.position, 'y', 0.0, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent).name('Position Y');
        lightConfiguration.add(this.__directionalLight.position, 'z', -this.__maxBoxDepth, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent).name('Position Z');

        lightConfiguration.add(this.__directionalLight.target.position, 'x', -this.__maxBoxWidth, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent).name('Target X');
        lightConfiguration.add(this.__directionalLight.target.position, 'y', 0.1, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent).name('Target Y');
        lightConfiguration.add(this.__directionalLight.target.position, 'z', -this.__maxBoxDepth, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent).name('Target Z');
        
        meshSizeFolder.open();
        meshRotationFolder.open();
        lightConfiguration.open();
    }

    __getPrincipleAxes(){
        let normal = this.__directionalLight.target.position.clone().sub(this.__directionalLight.position).normalize();
        let p1 = normal.clone().cross(UP_DIRECTION).normalize();
        let p2 = p1.clone().applyAxisAngle(normal, -Math.PI * 0.5).normalize();
        return {'normal': normal, 'p1': p1, 'p2': p2};
    }

    __addLightArrows(){
        let normalArrow = new ArrowHelper(UP_DIRECTION, new Vector3(), 50, 0x00FF00);
        let p1Arrow = new ArrowHelper(UP_DIRECTION, new Vector3(), 50, 0xFF0000);
        let p2Arrow = new ArrowHelper(UP_DIRECTION, new Vector3(), 50, 0x0000FF);

        this.__lightNormalArrow = normalArrow;
        this.__lightP1Arrow = p1Arrow;
        this.__lightP2Arrow = p2Arrow;

        this.__directionalLight.add(normalArrow);
        this.__directionalLight.add(p1Arrow);
        this.__directionalLight.add(p2Arrow);
    }
    __addBox(){
        let boxGeometry = new BoxGeometry(1, 1, 1);
        let boxMaterial = new MeshStandardMaterial({color: 0xF0F0F0});
        let box = new Mesh(boxGeometry, boxMaterial);
        this.__box = box;
        this.__box.scale.set(30, 30, this.__maxBoxDepth);
        this.add(box);                
    }

    __boxAboveTheGround(){
        this.__box.position.set(0, this.__box.scale.y * 0.5,0);
    }

    __updateLightArrows(){
        let p1p2 = this.__getPrincipleAxes();
        let normal = p1p2['normal'];
        let p1 = p1p2['p1'];
        let p2 = p1p2['p2'];
        this.__lightNormalArrow.setDirection(normal);
        this.__lightP1Arrow.setDirection(p1);
        this.__lightP2Arrow.setDirection(p2);
        // console.log('UPDATE DIRECTION ::: ', normal);
    }

    __projectCoordinates(){
        function project(O, P, I, J){
            let PO = P.clone().sub(O);
            let u = PO.dot(I);
            let v = PO.dot(J);
            return new Vector2(u, v);
        }
        let origin = this.__directionalLight.position.clone();
        let np1p2 = this.__getPrincipleAxes();
        let p1 = np1p2['p1'];
        let p2 = np1p2['p2'];
        let vertices = this.__box.geometry.getAttribute('position');
        let index = 0;
        let total = vertices.array.length;
        let points2D = [];
        let minBounds = new Vector2(1e7, 1e7);
        let maxBounds = new Vector2(-1e7, -1e7);
        // this.__box.geometry.computeBoundingBox();
        // console.log(this.__box.geometry);
        // console.log(`POSITIONS :: ${vertices.array}`);
        // console.log(`TOTAL : ${total}`);
        for(;index < total; index+=3){
            let p = new Vector3(vertices.array[index], vertices.array[index + 1], vertices.array[index + 2]);
            let uv = null;
            p = p.applyMatrix4(this.__box.matrixWorld);
            uv = project(origin, p, p1, p2);
            minBounds.x = Math.min(uv.x, minBounds.x);
            minBounds.y = Math.min(uv.y, minBounds.y);
            maxBounds.x = Math.max(uv.x, maxBounds.x);
            maxBounds.y = Math.max(uv.y, maxBounds.y);
            points2D.push(uv);
            // console.log(`3D : <${p.x}, ${p.y}, ${p.z}>, 2D: <${uv.x}, ${uv.y}>`);
        }
        this.__canvasProjection.points = points2D;
        this.__updateShadowCamera(minBounds, maxBounds);
    }

    __updateShadowCamera(minBounds, maxBounds){
        let width = maxBounds.x - minBounds.x;
        let height = maxBounds.y - minBounds.y;
        const d = Math.max(width, height);
        this.__directionalLight.shadow.camera.left = -d;
        this.__directionalLight.shadow.camera.top = d;

        this.__directionalLight.shadow.camera.right = d;        
        this.__directionalLight.shadow.camera.bottom = -d;
        this.__directionalLight.shadow.camera.matrixWorldNeedsUpdate = true;

        console.log(minBounds, maxBounds);
        console.log(width, height, d);
        console.log(this.__directionalLight.shadow.camera);
        
        this.__directionalLight.shadow.camera.updateProjectionMatrix();
    }

    __meshUpdated(value){
        this.__boxAboveTheGround();
        this.__updateLightArrows();
        this.__projectCoordinates();
    }

    __render(time){
        super.__render(time);
        if(this.__renderScene){            
            this.__canvasProjection.render(time);
         }
    }
};