import { AmbientLight, AxesHelper, CameraHelper, DirectionalLight, DirectionalLightHelper, FogExp2, GridHelper, HemisphereLight, LinearToneMapping, PCFSoftShadowMap, PerspectiveCamera, Scene, sRGBEncoding, Vector2, Vector3, WebGLRenderer } from "three";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from "stats.js";

export const BOUNDS = new Vector3(20, 20, 20);

export class ThreeScene extends Scene{
    constructor(elementID){
        super();

        this.__domID = (elementID) ? elementID : 'plane-projection';
        this.__domElement = document.getElementById(this.__domID);

        if(!this.__domElement){
            this.__domElement = document.createElement('DIV');
            this.__domElement.setAttribute('id', this.__domID);
            document.getElementsByTagName('BODY')[0].append(this.__domElement);
        }

        this.__prevTime = 0;
        this.__camera = null;
        this.__renderer = null;
        this.__composer = null;
        this.__controls = null;
        this.__ambientLight = null;
        this.__hemisphereLight = null;
        this.__fog = null;
        this.__skybox = null;
        this.__axes = null;
        this.__grid = null;
        this.__renderScene = true;
        this.__mapLoader = null;
        this.__outlinepass = null;

        this.__proceeduralCloudSystem = null;

        this.__cameraRestPosition = new Vector3(-20, 150, 200);
        this.__cameraTargetPosition = new Vector3(50, 0, 50);

        this.__stats = new Stats();
        document.body.appendChild(this.__stats.dom);

        this.__initialize();
    }

    __initialize(){
        let cameraNear = 1;
        let cameraFar = 10000;
        let fogNear = 250;
        let fogFar = 500;
        this.__outlinepass = null;
        this.__camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, cameraNear, cameraFar);
        this.__renderer = this.__getRenderer();
        
        this.__axes = new AxesHelper(BOUNDS.x);
        this.__grid = new GridHelper(500, 10);
        this.__controls = new OrbitControls(this.__camera, this.__domElement);
        this.__fog = new FogExp2(0x03544E, 0.001);
                
        this.__controls.enableDamping = true;
        this.__controls.dampingFactor = 0.5;
        this.__controls.minDistance = 4;
        this.__controls.screenSpacePanning = true;
        this.__controls.autoRotate = false;
        this.__controls.autoRotateSpeed  = 0.1;
        
        this.__camera.position.copy(this.__cameraRestPosition);
        this.__controls.target.copy(this.__cameraTargetPosition.clone());
        
        this.fog = this.__fog;       
        this.__controls.update();

        this.add(this.__grid);
        this.add(this.__axes);

        this.__addLights();
        this.__domElement.appendChild(this.__renderer.domElement);
        this.__renderer.setAnimationLoop(this.__render.bind(this));

        window.addEventListener('resize', this.__updateSize.bind(this));
        window.addEventListener('orientationchange', this.__updateSize.bind(this));

        this.__updateSize();
    }

    __addLights(){
        const d1 = 90;
        const d2 = 45;
        let hemiLight = new HemisphereLight(0xFFFFFF, 0x999999, 0.5);
        let ambiLight = new AmbientLight(0xFFFFFF);
        let directionLight = new DirectionalLight(0xF5AF19, 1.0);
        let directionLightHelper = new DirectionalLightHelper(directionLight);
        let cameraHelper = new CameraHelper( directionLight.shadow.camera );
        

        ambiLight.intensity = 0.15;
        hemiLight.position.set(0, 1000, 0);

        directionLight.position.set(100, 0, 0);
        directionLight.target.position.set(0, 0, 0);

        directionLight.shadow.camera.left = -d1;
        directionLight.shadow.camera.right = d1;
        directionLight.shadow.camera.top = d2;
        directionLight.shadow.camera.bottom = -d2;
        directionLight.shadow.camera.near = 0;
        directionLight.shadow.camera.far = 200;
        directionLight.shadow.autoUpdate = true;
        // directionLight.shadow.mapSize.width = d1 * 2;
        // directionLight.shadow.mapSize.height = d2 * 2;

        directionLight.shadow.mapSize.set(d1, d2);

        this.__hemisphereLight = hemiLight;
        this.__ambientLight = ambiLight;
        this.__directionalLight = directionLight;
        this.__directionalShadowCameraHelper = cameraHelper;

        directionLight.castShadow = true;

        this.add(hemiLight);
        this.add(ambiLight);

        this.add(directionLight);
        this.add(directionLight.target);
        this.add(directionLightHelper);
        this.add(cameraHelper);

    }
    __getRenderer(){
        let renderer = new WebGLRenderer({antialias: true, alpha: true});
        renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
        renderer.shadowMap.type = PCFSoftShadowMap;
        renderer.outputEncoding = sRGBEncoding;
        renderer.toneMapping = LinearToneMapping;
        
        renderer.shadowCameraFar = this.__camera.far;

        renderer.setClearColor(0xFFFFFF, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        return renderer;
    }

    __getSize(){
        let heightMargin = this.__domElement.offsetTop;
        let widthMargin = this.__domElement.offsetLeft;
        let elementWidth = window.innerWidth - widthMargin;
        let elementHeight = window.innerHeight - heightMargin;

        return new Vector2(elementWidth, elementHeight);
    }

    __updateSize(){
        
        let size = this.__getSize();
        this.__camera.aspect = size.x / size.y;
        this.__camera.updateProjectionMatrix();
        this.__renderer.setSize(size.x, size.y);
    }

    __render(time){
        this.__stats.begin();
        this.__prevTime = time;
        this.__controls.update();
        if(this.__renderScene){            
           this.__renderer.render(this, this.__camera); 
        }
        this.__stats.end();
    }

    get domInfoId(){
        return this.__domInfoId;
    }

    set domInfoId(id){
        this.__domInfoId = id;
        this.__domInfoElement = document.getElementById(id);
    }
}