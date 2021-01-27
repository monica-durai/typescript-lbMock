// Import stylesheets
//import './style.css';

// Write TypeScript code!
//const appDiv: HTMLElement = document.getElementById('app');
//appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

// Welcome to the TypeScript Playground, this is a website
// which gives you a chance to write, share and learn TypeScript.

//TODO: uncomment to make parallel processing
//export{}

class Provider {
  private uid: string

  constructor(){
      this.uid = Math.random().toString(36).substring(2)
  }

  get(){
      return this.uid
  }

  check(): number{
    return Math.round(Math.random())%2  //simulate random codes alive (1) or not (0)
  }
}

class LoadBalancer {
    static instance: LoadBalancer
    //TODO: make private
    providerList:Array<[Provider,number,number]>  //List of tuples of [Provider, state -active(1) or inactve(0), #requests (limited to Y)]
    private heartbeatTimerID: number
    
    firstProvider: number           //Provider-list head index
    lastProvider: number            //Provider-list tail index
    currentProvider: number         //Provider-list pointer
    countProviders: number          //count of active Provider list items

  private constructor() {
      this.providerList = new Array([new Provider(),1,0])                   //a load balancer will have atleast one active provider 
      this.countProviders = this.currentProvider = 1                        //Provider-list pointer always holds a value between 1 and maxProviders
      this.lastProvider = this.firstProvider = 0                            //initiate indices
      this.heartbeatTimerID = setInterval(this.heartbeatChecker, X*1000)
  }

  private static instantiate = () =>
      new Promise<number>((resolve, reject) => {
       if (LoadBalancer.instance == null){
         LoadBalancer.instance = new LoadBalancer()
         resolve(0)
         return
      }     
    reject("Already instantiated")
  });

  public static instantiateLoadBalancer = async() => {
      if (LoadBalancer.instance == null){      
        try{
          await LoadBalancer.instantiate()
        }catch(err){
          console.log("ERROR------>",err)
        }      
      }
  }

  public static getInstance(){
    LoadBalancer.instantiateLoadBalancer()
    return LoadBalancer.instance
  }

  private heartbeatChecker = async() => {
    
      this.providerList.forEach(item => { 
        let currentStatus: number = item[0].check()
        if(currentStatus == 1){                       //Change it to simply if(currentStatus == 1 && item[1]==0) item[1] = -1
          if(item[1] == 0)
            item[1] = -1
          else if(item[1] == -1)
            item[1] = 1
        }
        else  
          item[1] = currentStatus
  });
  console.log("Heartbeat----> # Active Providers = ",this.providerList.filter(item=>item[1]==1).length)
  }

  private pushProvider =(provider:Provider) =>    new Promise<void>((resolve,reject)=>{
      if(this.countProviders!=maxProviders){
        this.lastProvider = this.countProviders++    
        this.providerList.push([provider,1,0]) //add to list
        resolve()
       }
      reject()
  });

  public registerProvider =async(provider: Provider): Promise<number> => {
      if(this.countProviders==maxProviders) {
          return 0 // no more Providers may be registered
  }
      this.pushProvider(provider)
      return 1
  }

  get() : string{
      return this.providerList[this.currentProvider-1][0].get()
  }

  public getRandomProvider() : string {
      
      this.currentProvider = (0 + Math.random()*this.countProviders) + 1      //generate random number within the count of active providers
      //console.log(this.currentProvider)
      return this.providerList[Math.floor(this.currentProvider)-1][0].get()
  }

  public getNextProvider() : string {                                                //Round robin invocation
      if( this.currentProvider-1 == this.lastProvider ){
          this.currentProvider = this.firstProvider
      }
      return this.providerList[this.currentProvider++][0].get()
  }

  public excludeProvider =async(uid: string) : Promise<number> =>{
  this.providerList.find(item => { item[1] = item[0].get() == uid ? 0 : item[1]
  });
      
    return 1
  }

  public includeProvider =async(uid: string) : Promise<number>=>{
  this.providerList.find(item => { item[1] = item[0].get() == uid ? 1 : item[1]
  });
      
    return 1
  }

  public sendRequest(): [Provider,number,number] | undefined {

    return this.providerList.find(item => {
      if(item[1]==1 && item[2]<Y){
        item[2]++  
        return 1                                    //Request successfully sent to Provider
      }
      else{
        return 0                                    //All providers are busy at the moment, cannot accept this request
      }
    })  
  }

  public destroy(){
    clearInterval(this.heartbeatTimerID)
    console.log("Heartbeat Checker Stopped")
  }

}

const maxProviders:number = 10        //this can be externalised to a config file
const X:number = 1                   //heartbeat check interval
const Y:number =  3                   //max.number of parallel requests per node

function checkLoadBalancer(){
  let loadBalancer = LoadBalancer.getInstance()
  console.log(loadBalancer)
  //LoadBalancer.instantiateLoadBalancer()
  //console.log(loadBalancer.get())
  loadBalancer.registerProvider(new Provider())
  let n:number =11
  while(n-->0){
      let prov: Provider = new Provider()
      loadBalancer.registerProvider(prov).then((value)=> {
      //console.log(value.valueOf())
  });
  //console.log(prov.check())
  console.log(loadBalancer.getNextProvider())
    }
    loadBalancer.excludeProvider(loadBalancer.get())
  n=10
    while(n-->0){
      console.log(loadBalancer.providerList[n][1])
    }
  console.log(loadBalancer.getNextProvider()) 
  n=31
  while(n-->0){
    if( loadBalancer.sendRequest() != undefined)
      console.log("REquest successful")
    else
      console.log("Cluster Capacity Exceeded, cannot handle request")

  }
  loadBalancer.destroy()
}

//const responses = await Promise.all([promise1, promise2, promise3])

checkLoadBalancer()

// To learn more about the language, click above in "Examples" or "What's New".
// Otherwise, get started by removing these comments and the world is your playground.
