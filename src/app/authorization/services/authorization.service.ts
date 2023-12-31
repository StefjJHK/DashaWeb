import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { EMPTY, Observable, catchError, map, tap } from "rxjs";
import { Token } from "src/app/shared/interfaces/token.intarface";
import { UpdateUser, User } from "src/app/shared/interfaces/user.interface";

@Injectable({
  providedIn: "root"
})
export class AuthorizationService {
  url: string = "http://164.92.120.9";
  token: string | null = localStorage.getItem("token");

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  httpOptions = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };

  private testConnection(): Observable<string> {
    return this.http.get(this.url, {...this.httpOptions, responseType: "text"});
  }

  public register(user: User): Observable<Token | HttpErrorResponse> {
    return this.http.post<Token>(this.url + "/users", user, {...this.httpOptions, responseType: "json"}).pipe(
      catchError((err: HttpErrorResponse) => {
        if(err.status === 400 || err.status === 422) {
          this.router.navigate(["/user/register"], {
            queryParams: {error: err.statusText}
          });
        }
        
        return EMPTY;
      }),
      map(data => {
        this.router.navigate(["/main"]);

        this.token = data.name

        localStorage.setItem("token", data.name);

        return data;
      })
    );
  }

  public login(login: string, password: string): Observable<Token | HttpErrorResponse> {
    return this.http.post<Token>(this.url + "/users/login", {login, password}, {...this.httpOptions, responseType: "json"}).pipe(
      catchError((err: HttpErrorResponse) => {
        if(err.status === 404) {
          this.router.navigate(["/user/login"], {
            queryParams: {error: "Неправильный логин или пароль"}
          });
        }

        throw err;
      }),
      map(data => {
        this.router.navigate(["/main"]);

        this.token = data.name;

        localStorage.setItem("token", data.name);

        return data;
      })
    );
  }

  checkToken(): Observable<User> {
    if(this.token) {
      return this.http.get<User>(this.url + "/users/token", {
        headers: {"token": this.token},
        responseType: "json",
      }).pipe(
        catchError(() => {
          this.router.navigate(["/user/login"]);
          console.log("s")
          
          return EMPTY
        })
      );
    }
    this.router.navigate(["/user/login"], {
      queryParams: {
        error: "Необходима авторизация"
      }
    });

    this.token = null;

    localStorage.removeItem("token");

    return new Observable();
  }

  public logout() {
    this.router.navigate(["/user/login"], {
      queryParams: {error: "Необходима авторизация"}
    });

    this.token = null;

    localStorage.removeItem("token");
  }

  public isAuthorized(): Observable<boolean> {
    return this.checkToken().pipe(
      catchError(() => {
        return EMPTY
      }),
      map(() => true)
    );
  }

  public isAdmin(): Observable<boolean>{
    return this.checkToken().pipe(
      catchError(() => EMPTY),
      map((data) => {
        if(data) {
          return !!data.isTeacher;
        }
        
        return false
      })
    );
  }

  public update(updateUser: UpdateUser): Observable<User> {
    return this.http.put<User>(this.url + "/users", updateUser, {responseType: "json", ...this.httpOptions});
  }

  public delete(id: number) {
    this.logout();

    this.router.navigate(["user/login"]);
    return this.http.delete(this.url + "/users/" + id);
  }
}
