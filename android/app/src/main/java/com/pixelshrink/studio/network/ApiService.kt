package com.pixelshrink.studio.network

import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface ApiService {
    @Multipart
    @POST("remove-bg") // Ensure this matches the route in your Python server
    fun removeBackground(@Part image: MultipartBody.Part): Call<ResponseBody>
}