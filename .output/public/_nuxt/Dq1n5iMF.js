import{_ as S}from"./DQAP8G1n.js";import{_ as l}from"./CCmYOoiB.js";import{d as k,f as N,h as x,w as t,a as i,r as c,g as f,j as s,b as y,_ as T}from"./B3_Rn74p.js";const I={class:"d-flex flex-wrap gap-2"},P={class:"d-flex flex-wrap gap-2"},b={class:"d-flex flex-wrap gap-2"},A=k({__name:"test-notifications",setup(B){const n=N(),u=()=>{n.success("Operation completed successfully!")},d=()=>{n.error("An error occurred while processing your request")},m=()=>{n.warning("Please review your input before submitting")},p=()=>{n.info("This is an informational message")},_=()=>{n.success("This message will disappear in 10 seconds",1e4)},w=()=>{n.success("First notification"),setTimeout(()=>n.info("Second notification"),500),setTimeout(()=>n.warning("Third notification"),1e3),setTimeout(()=>n.error("Fourth notification"),1500)},g=async()=>{n.info("Processing..."),setTimeout(()=>{n.success("Data saved successfully!")},1500)},v=async()=>{n.info("Processing..."),setTimeout(()=>{n.error("Failed to save data: Server error")},1500)};return(D,o)=>{const r=c("v-icon"),e=c("v-btn"),a=c("v-col"),C=c("v-row");return y(),x(S,{title:"Notification System Demo"},{default:t(()=>[i(C,null,{default:t(()=>[i(a,{cols:"12"},{default:t(()=>[i(l,{title:"Basic Notifications"},{default:t(()=>[f("div",I,[i(e,{color:"success",onClick:u},{default:t(()=>[i(r,{start:""},{default:t(()=>o[0]||(o[0]=[s("mdi-check-circle")])),_:1}),o[1]||(o[1]=s(" Success Notification "))]),_:1}),i(e,{color:"error",onClick:d},{default:t(()=>[i(r,{start:""},{default:t(()=>o[2]||(o[2]=[s("mdi-alert-circle")])),_:1}),o[3]||(o[3]=s(" Error Notification "))]),_:1}),i(e,{color:"warning",onClick:m},{default:t(()=>[i(r,{start:""},{default:t(()=>o[4]||(o[4]=[s("mdi-alert")])),_:1}),o[5]||(o[5]=s(" Warning Notification "))]),_:1}),i(e,{color:"info",onClick:p},{default:t(()=>[i(r,{start:""},{default:t(()=>o[6]||(o[6]=[s("mdi-information")])),_:1}),o[7]||(o[7]=s(" Info Notification "))]),_:1})])]),_:1})]),_:1}),i(a,{cols:"12"},{default:t(()=>[i(l,{title:"Custom Duration"},{default:t(()=>[f("div",P,[i(e,{color:"primary",onClick:_},{default:t(()=>o[8]||(o[8]=[s(" Show 10 Second Message ")])),_:1}),i(e,{color:"secondary",onClick:w},{default:t(()=>o[9]||(o[9]=[s(" Show Multiple Notifications ")])),_:1})])]),_:1})]),_:1}),i(a,{cols:"12"},{default:t(()=>[i(l,{title:"Simulated API Operations"},{default:t(()=>[f("div",b,[i(e,{color:"success",onClick:g},{default:t(()=>[i(r,{start:""},{default:t(()=>o[10]||(o[10]=[s("mdi-cloud-check")])),_:1}),o[11]||(o[11]=s(" Simulate Successful API Call "))]),_:1}),i(e,{color:"error",onClick:v},{default:t(()=>[i(r,{start:""},{default:t(()=>o[12]||(o[12]=[s("mdi-cloud-alert")])),_:1}),o[13]||(o[13]=s(" Simulate Failed API Call "))]),_:1})])]),_:1})]),_:1}),i(a,{cols:"12"},{default:t(()=>[i(l,{title:"Usage in Code"},{default:t(()=>o[14]||(o[14]=[f("pre",{class:"code-block"},`const notification = useNotification()

// Success
notification.success('Operation completed successfully')

// Error
notification.error('Something went wrong')

// Warning
notification.warning('Please review your input')

// Info
notification.info('Here is some information')

// Custom duration (milliseconds)
notification.success('Quick message', 1500)
notification.error('Long message', 10000)
          `,-1)])),_:1})]),_:1})]),_:1})]),_:1})}}}),O=T(A,[["__scopeId","data-v-ccf17d43"]]);export{O as default};
