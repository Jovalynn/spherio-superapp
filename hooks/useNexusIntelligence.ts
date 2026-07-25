"use client";

import { useEffect,useState } from "react";
import { getNexusIntelligence } from "@/lib/riomind/intelligence/intelligence-service";

export function useNexusIntelligence(input:any){

    const [loading,setLoading]=useState(true);
    const [data,setData]=useState<any>(null);

    useEffect(()=>{

        let mounted=true;

        async function load(){

            setLoading(true);

            const intelligence=await getNexusIntelligence(input);

            if(mounted){
                setData(intelligence);
                setLoading(false);
            }

        }

        load();

        return ()=>{mounted=false;}

    },[
        JSON.stringify(input)
    ]);

    return{
        loading,
        intelligence:data
    };

}
