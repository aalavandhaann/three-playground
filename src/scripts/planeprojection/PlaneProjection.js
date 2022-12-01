import { GUI } from "dat.gui";
import { CameraHelper, Plane } from "three";
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
        this.__boxContributes = true;
        this.__boxLContributes = true;
        this.__boxRContributes = true;
        this.__shadowCameraViewUpdate = this.__updateShadowCameraView.bind(this);
        this.__addLightArrows();
        this.__addMeshes();
        this.__addGUI();
        this.__meshUpdated();
    }

    __addGUI(){
        let gui = new GUI({name: 'Plane Projector'});
        let meshSizeFolder = gui.addFolder('Mesh Size')
        let meshRotationFolder = gui.addFolder('Mesh Orientation');
        let lightConfiguration = gui.addFolder('Directional Light Configuration');
        let lightStrengthConfiguration = gui.addFolder('Lights Property Configuration');

        let shadowsConfiguration = gui.addFolder('Shadow Contributors');
        let lightContributorsConfiguration = gui.addFolder('Light Contributors');
        let shadowCameraViewUpdateEvent = this.__updateShadowCameraView.bind(this);


        meshSizeFolder.add(this.__box.scale, 'x', 0.1, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent);
        meshSizeFolder.add(this.__box.scale, 'y', 0.1, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent);
        meshSizeFolder.add(this.__box.scale, 'z', 0.1, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent);
                
        meshRotationFolder.add(this.__box.rotation, 'y', 0.0, Math.PI * 2.0, 0.1).onChange(this.__meshUpdatedEvent);

        lightConfiguration.add(this.__directionalLight.position, 'x', -this.__maxBoxWidth, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent).name('Position X');
        lightConfiguration.add(this.__directionalLight.position, 'y', 0.0, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent).name('Position Y');
        lightConfiguration.add(this.__directionalLight.position, 'z', -this.__maxBoxDepth, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent).name('Position Z');

        lightConfiguration.add(this.__directionalLight.target.position, 'x', -this.__maxBoxWidth, this.__maxBoxWidth).onChange(this.__meshUpdatedEvent).name('Focus X');
        lightConfiguration.add(this.__directionalLight.target.position, 'y', 0.1, this.__maxBoxHeight).onChange(this.__meshUpdatedEvent).name('Focus Y');
        lightConfiguration.add(this.__directionalLight.target.position, 'z', -this.__maxBoxDepth, this.__maxBoxDepth).onChange(this.__meshUpdatedEvent).name('Focus Z');
        lightConfiguration.add(this, '__shadowCameraViewUpdate').name('Update');

        lightStrengthConfiguration.add(this.__directionalLight, 'intensity', 0.0, 5.0).onChange(this.__meshUpdatedEvent).name('Directional Intensity');
        lightStrengthConfiguration.add(this.__ambientLight, 'intensity', 0.0, 5.0).onChange(this.__meshUpdatedEvent).name('Ambient Intensity');
        lightStrengthConfiguration.add(this.__hemisphereLight, 'intensity', 0.0, 5.0).onChange(this.__meshUpdatedEvent).name('Hemisphere Intensity');

        lightStrengthConfiguration.addColor(this.__directionalLight, 'color').onChange(this.__meshUpdatedEvent).name('Directional Color');
        lightStrengthConfiguration.addColor(this.__ambientLight, 'color').onChange(this.__meshUpdatedEvent).name('Ambient Color');
        lightStrengthConfiguration.addColor(this.__hemisphereLight, 'color').onChange(this.__meshUpdatedEvent).name('Hemisphere Sky');
        lightStrengthConfiguration.addColor(this.__hemisphereLight, 'groundColor').onChange(this.__meshUpdatedEvent).name('Hemisphere Ground');
        
        shadowsConfiguration.add(this, '__boxContributes').name('Box Middle').onChange(this.__meshUpdatedEvent);
        shadowsConfiguration.add(this, '__boxLContributes').name('Box Left').onChange(this.__meshUpdatedEvent);
        shadowsConfiguration.add(this, '__boxRContributes').name('Box Right').onChange(this.__meshUpdatedEvent);
        

        lightContributorsConfiguration.add(this.__ambientLight, 'visible').name('Ambient Light').onChange(this.__meshUpdatedEvent);
        lightContributorsConfiguration.add(this.__hemisphereLight, 'visible').name('Hemisphere Light').onChange(this.__meshUpdatedEvent);
        lightContributorsConfiguration.add(this.__directionalLight, 'visible').name('Directional Light').onChange(this.__meshUpdatedEvent);
        // meshSizeFolder.open();
        // meshRotationFolder.open();
        // lightConfiguration.open();
        // shadowsConfiguration.open();
        // lightContributorsConfiguration.open();
        // lightStrengthConfiguration.open();
    }

    __getPrincipleAxes(object3d = null){
        object3d = (object3d) ? object3d : this.__directionalLight;
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

    __addPillar(x=0, y=0, z=0){
        let pillarMaterial = new MeshStandardMaterial({color: 0xF0F0F0});
        let pillarGeometry = new BoxGeometry(10, 50, 10);
        let pillar = new Mesh(pillarGeometry, pillarMaterial);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        pillar.position.set(x, y, z);
        this.add(pillar);
        return pillar;
    }

    __addABox(){
        let boxGeometry = new BoxGeometry(1, 1, 1);
        let boxMaterial = new MeshStandardMaterial({color: 0xF0F0F0});
        let box = new Mesh(boxGeometry, boxMaterial);
        box.scale.set(30, 30, 30);
        box.castShadow = true;
        box.receiveShadow = true;
        // box.updateMatrixWorld();
        return box;
    }
    
    __addMeshes(){
        this.__box = this.__addABox();
        this.__boxL = this.__addABox();
        this.__boxR = this.__addABox();
        this.__addPillar(55, 25, -45);
        this.__addPillar(55, 25, 0);
        this.__addPillar(55, 25, 45);         
        this.add(this.__box);
        this.add(this.__boxL);
        this.add(this.__boxR);
    }

    __boxAboveTheGround(){
        let offsets = this.__box.scale.clone();
        this.__boxL.scale.copy(this.__box.scale);
        this.__boxR.scale.copy(this.__box.scale);

        this.__box.position.set(0, this.__box.scale.y * 0.5, 0);
        this.__boxL.position.set(0, offsets.y * 0.5, (offsets.z + 5));
        this.__boxR.position.set(0, offsets.y * 0.5, -(offsets.z + 5));

        this.__boxL.rotation.copy(this.__box.rotation);
        this.__boxR.rotation.copy(this.__box.rotation);

        this.__box.updateMatrixWorld();
        this.__boxL.updateMatrixWorld();
        this.__boxR.updateMatrixWorld();
    }

    __updateLightArrows(){
        let p1p2 = this.__getPrincipleAxes();
        let normal = p1p2['normal'];
        let p1 = p1p2['p1'];
        let p2 = p1p2['p2'];
        this.__lightNormalArrow.setDirection(normal);
        this.__lightP1Arrow.setDirection(p1);
        this.__lightP2Arrow.setDirection(p2);
    }

    __projectCoordinates(){
        function project(O, P, I, J){
            let PO = P.clone().sub(O);
            let u = PO.dot(I);
            let v = PO.dot(J);
            return new Vector2(u, v);
        }
        function updateMinMax(mesh, minBounds, maxBounds){
            let points = [];
            let vertices = mesh.geometry.getAttribute('position').array;
            let total = vertices.length;
            mesh.updateMatrixWorld();
            for(let index=0;index < total; index+=3){
                let pVertex = new Vector3(vertices[index], vertices[index + 1], vertices[index + 2]);
                let p = new Vector3(vertices[index], vertices[index + 1], vertices[index + 2]);
                let uv = null;
                p.applyMatrix4(mesh.matrixWorld);
                // pVertex.applyMatrix4(mesh.matrixWorld);
                // p = plane.projectPoint(pVertex, p);
                uv = project(origin, p, p1, p2);
                minBounds.x = Math.min(uv.x, minBounds.x);
                minBounds.y = Math.min(uv.y, minBounds.y);
                maxBounds.x = Math.max(uv.x, maxBounds.x);
                maxBounds.y = Math.max(uv.y, maxBounds.y);
                points.push(uv);
            }
            return points;
        }        
        let origin = this.__directionalLight.position.clone();
        let np1p2 = this.__getPrincipleAxes();
        let plane = new Plane(np1p2['normal'], origin.length());        
        let p1 = np1p2['p1'];
        let p2 = np1p2['p2'];
        let points2D = [];
        let minBounds = new Vector2(1e7, 1e7);
        let maxBounds = new Vector2(-1e7, -1e7);
        if(this.__boxContributes){
            points2D = points2D.concat(updateMinMax(this.__box, minBounds, maxBounds));
        }
        if(this.__boxLContributes){
            points2D = points2D.concat(updateMinMax(this.__boxL, minBounds, maxBounds));
        }
        if(this.__boxRContributes){
            points2D = points2D.concat(updateMinMax(this.__boxR, minBounds, maxBounds));
        }       
        
        this.__canvasProjection.points = points2D;
        this.__updateShadowCamera(minBounds, maxBounds);
    }

    __updateShadowCamera(minBounds, maxBounds){
        console.log('MIN AND MAX : ', minBounds, maxBounds);
        let multiplier = 1;
        let width = maxBounds.x - minBounds.x;
        let height = maxBounds.y - minBounds.y;
        const d = Math.max(width, height);

        this.__directionalLight.shadow.camera.left = minBounds.x * multiplier;
        this.__directionalLight.shadow.camera.top = maxBounds.y * multiplier;

        this.__directionalLight.shadow.camera.right = maxBounds.x * multiplier;        
        this.__directionalLight.shadow.camera.bottom = minBounds.y * multiplier;

        this.__directionalLight.updateMatrixWorld();
        this.__updateShadowCameraView();

        // this.__directionalShadowCameraHelper.camera = this.__directionalLight.shadow.camera;
        // this.__directionalShadowCameraHelper.matrixWorld = this.__directionalLight.shadow.camera.matrixWorld;
        // this.__directionalShadowCameraHelper.update();
        // this.__directionalShadowCameraHelper.updateMatrixWorld();
    }

    __updateShadowCameraView(){
        let cameraHelper = new CameraHelper( this.__directionalLight.shadow.camera );
        let currentHelper = this.__directionalShadowCameraHelper;
        
        this.__directionalShadowCameraHelper = cameraHelper;

        this.remove(currentHelper);
        this.add(cameraHelper);        
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